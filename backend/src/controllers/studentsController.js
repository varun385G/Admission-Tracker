const Student = require('../models/Student');
const { logAudit } = require('../utils/logger');
const { Parser } = require('json2csv');
const { parse } = require('csv-parse/sync');

const VALID_STATUSES = [
  'New Enquiry', 'Contacted', 'Counselling Scheduled',
  'Document Submitted', 'Admitted', 'Rejected', 'Not Interested'
];

const maskPhone = (phone) => {
  if (!phone || phone.length < 9) return phone;
  return phone.substring(0, 2) + 'X'.repeat(phone.length - 4) + phone.substring(phone.length - 3);
};

const sanitize = (str) => str ? str.replace(/<[^>]*>/g, '').trim() : str;

const getStudents = async (req, res) => {
  const { page = 1, limit = 20, search, status, course, staff_id, from, to } = req.query;
  const isAdmin = req.user.role === 'admin';

  const filter = { is_deleted: false };

  if (!isAdmin) {
    filter.assigned_staff_id = req.user.id;
  } else if (staff_id) {
    filter.assigned_staff_id = staff_id;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (course) filter.course_interested = course;
  if (from || to) {
    filter.created_at = {};
    if (from) filter.created_at.$gte = new Date(from);
    if (to) filter.created_at.$lte = new Date(to + 'T23:59:59');
  }

  try {
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('assigned_staff_id', 'name')
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const result = students.map(s => ({
      ...s,
      id: s._id,
      assigned_staff_id: s.assigned_staff_id?._id,
      staff_name: s.assigned_staff_id?.name,
      phone: maskPhone(s.phone),
    }));

    res.json({
      students: result,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getStudent = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const filter = { _id: id, is_deleted: false };
    if (!isAdmin) filter.assigned_staff_id = req.user.id;

    const student = await Student.findOne(filter).populate('assigned_staff_id', 'name').lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json({ student: { ...student, id: student._id, staff_name: student.assigned_staff_id?.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  const {
    name, email, phone, course_interested, status, assigned_staff_id,
    twelfth_percentage, entrance_score, counselling_date, next_followup_date,
    lead_source, notes
  } = req.body;

  try {
    const student = await Student.create({
      name: sanitize(name), email, phone,
      course_interested: sanitize(course_interested),
      status: status || 'New Enquiry',
      assigned_staff_id: assigned_staff_id || null,
      twelfth_percentage: twelfth_percentage || null,
      entrance_score: entrance_score || null,
      counselling_date: counselling_date || null,
      next_followup_date: next_followup_date || null,
      lead_source: sanitize(lead_source),
      notes: sanitize(notes),
    });

    await logAudit({ user_id: req.user.id, action: 'CREATE_STUDENT', entity_type: 'student', entity_id: student._id, details: { name, email }, ip_address: req.ip });

    res.status(201).json({ student: { ...student.toObject(), id: student._id } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const existing = await Student.findOne({ _id: id, is_deleted: false });
    if (!existing) return res.status(404).json({ error: 'Student not found' });

    if (!isAdmin && existing.assigned_staff_id?.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let updateData;
    if (isAdmin) {
      const { name, email, phone, course_interested, status, assigned_staff_id, twelfth_percentage, entrance_score, counselling_date, next_followup_date, lead_source } = req.body;
      updateData = {
        name: sanitize(name) || existing.name,
        email: email || existing.email,
        phone: phone || existing.phone,
        course_interested: sanitize(course_interested) || existing.course_interested,
        status: status || existing.status,
        assigned_staff_id: assigned_staff_id || existing.assigned_staff_id,
        twelfth_percentage: twelfth_percentage ?? existing.twelfth_percentage,
        entrance_score: entrance_score ?? existing.entrance_score,
        counselling_date: counselling_date || existing.counselling_date,
        next_followup_date: next_followup_date || existing.next_followup_date,
        lead_source: sanitize(lead_source) || existing.lead_source,
      };
    } else {
      const { status, next_followup_date } = req.body;
      updateData = {
        status: status || existing.status,
        next_followup_date: next_followup_date || existing.next_followup_date,
      };
    }

    const updated = await Student.findByIdAndUpdate(id, updateData, { new: true }).lean();
    await logAudit({ user_id: req.user.id, action: 'UPDATE_STUDENT', entity_type: 'student', entity_id: id, details: { before: existing.status, after: updated.status }, ip_address: req.ip });

    res.json({ student: { ...updated, id: updated._id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndUpdate(id, { is_deleted: true });
    await logAudit({ user_id: req.user.id, action: 'DELETE_STUDENT', entity_type: 'student', entity_id: id, ip_address: req.ip });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const bulkUpdateStatus = async (req, res) => {
  const { ids, status } = req.body;
  if (!ids?.length || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid ids or status' });
  }
  try {
    await Student.updateMany({ _id: { $in: ids } }, { status });
    await logAudit({ user_id: req.user.id, action: 'BULK_STATUS_UPDATE', entity_type: 'student', details: { ids, status }, ip_address: req.ip });
    res.json({ message: `Updated ${ids.length} students to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const students = await Student.find({ is_deleted: false })
      .populate('assigned_staff_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const rows = students.map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      phone: maskPhone(s.phone),
      course_interested: s.course_interested,
      status: s.status,
      assigned_staff: s.assigned_staff_id?.name || '',
      twelfth_percentage: s.twelfth_percentage,
      entrance_score: s.entrance_score,
      lead_source: s.lead_source,
      next_followup_date: s.next_followup_date,
      created_at: s.created_at,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('students.csv');
    res.send(csv);
    await logAudit({ user_id: req.user.id, action: 'EXPORT_CSV', entity_type: 'student', ip_address: req.ip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
};

const uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true });
    const toInsert = [];
    const duplicates = [];

    for (const row of records) {
      const exists = await Student.findOne({ $or: [{ email: row.email }, { phone: row.phone }] });
      if (exists) duplicates.push(row);
      else toInsert.push(row);
    }

    res.json({ toInsert, duplicates, total: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'CSV parse error' });
  }
};

const confirmUpload = async (req, res) => {
  const { rows } = req.body;
  if (!rows?.length) return res.status(400).json({ error: 'No rows to insert' });

  let inserted = 0;
  const errors = [];
  for (const row of rows) {
    try {
      await Student.create({ name: row.name, email: row.email, phone: row.phone, course_interested: row.course_interested, lead_source: row.lead_source });
      inserted++;
    } catch (e) {
      if (e.code !== 11000) errors.push({ row, error: e.message });
    }
  }
  res.json({ inserted, errors });
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, bulkUpdateStatus, exportCSV, uploadCSV, confirmUpload };
