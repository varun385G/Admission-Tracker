const Student = require('../models/Student');
const User = require('../models/User');
const Note = require('../models/Note');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const overview = async (req, res) => {
  try {
    const [total, admitted, rejected, pending, todayFU, staffCount] = await Promise.all([
      Student.countDocuments({ is_deleted: false }),
      Student.countDocuments({ status: 'Admitted', is_deleted: false }),
      Student.countDocuments({ status: 'Rejected', is_deleted: false }),
      Student.countDocuments({ status: { $nin: ['Admitted', 'Rejected', 'Not Interested'] }, is_deleted: false }),
      Student.countDocuments({ next_followup_date: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) }, is_deleted: false }),
      User.countDocuments({ is_active: true, role: 'staff' }),
    ]);

    res.json({
      total, admitted, rejected, pending,
      today_followups: todayFU,
      staff_count: staffCount,
      conversion_rate: total > 0 ? Math.round(admitted / total * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const conversionFunnel = async (req, res) => {
  try {
    const result = await Student.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = {};
    result.forEach(r => { map[r._id] = r.count; });

    const stages = ['New Enquiry', 'Contacted', 'Counselling Scheduled', 'Document Submitted', 'Admitted'];
    const funnel = stages.map(s => ({ status: s, count: map[s] || 0 }));

    res.json({ funnel, other: { Rejected: map['Rejected'] || 0, 'Not Interested': map['Not Interested'] || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const leadSources = async (req, res) => {
  try {
    const result = await Student.aggregate([
      { $match: { is_deleted: false, lead_source: { $ne: null } } },
      {
        $group: {
          _id: '$lead_source',
          total: { $sum: 1 },
          admitted: { $sum: { $cond: [{ $eq: ['$status', 'Admitted'] }, 1, 0] } },
        }
      },
      { $sort: { total: -1 } },
    ]);

    const sources = result.map(r => ({
      source: r._id,
      total: r.total,
      admitted: r.admitted,
      rate: r.total > 0 ? Math.round(r.admitted / r.total * 100) : 0,
    }));

    res.json({ sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const staffPerformance = async (req, res) => {
  try {
    const staffList = await User.find({ role: 'staff', is_active: true }).lean();

    const staff = await Promise.all(staffList.map(async (u) => {
      const [total_assigned, admitted, total_notes] = await Promise.all([
        Student.countDocuments({ assigned_staff_id: u._id, is_deleted: false }),
        Student.countDocuments({ assigned_staff_id: u._id, status: 'Admitted', is_deleted: false }),
        Note.countDocuments({ staff_id: u._id }),
      ]);
      return {
        id: u._id,
        name: u.name,
        total_assigned,
        admitted,
        total_notes,
        conversion_rate: total_assigned > 0 ? Math.round(admitted / total_assigned * 100) : 0,
      };
    }));

    staff.sort((a, b) => b.admitted - a.admitted);
    res.json({ staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const trends = async (req, res) => {
  const { range = '30d' } = req.query;
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Student.aggregate([
      { $match: { is_deleted: false, created_at: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          enquiries: { $sum: 1 },
          admitted: { $sum: { $cond: [{ $eq: ['$status', 'Admitted'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = result.map(r => ({ date: r._id, enquiries: r.enquiries, admitted: r.admitted, rejected: r.rejected }));
    res.json({ trends, range });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const calendarData = async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

  try {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);

    const result = await Student.aggregate([
      { $match: { is_deleted: false, next_followup_date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$next_followup_date' } },
          count: { $sum: 1 },
        }
      },
    ]);

    const data = {};
    result.forEach(r => { data[r._id] = r.count; });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 9) return phone;
  return phone.substring(0, 2) + 'X'.repeat(phone.length - 4) + phone.substring(phone.length - 3);
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
      staff: s.assigned_staff_id?.name || '',
      twelfth_percentage: s.twelfth_percentage,
      entrance_score: s.entrance_score,
      lead_source: s.lead_source,
      next_followup_date: s.next_followup_date,
      created_at: s.created_at,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('admission-report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const [total, admitted, rejected, staffList] = await Promise.all([
      Student.countDocuments({ is_deleted: false }),
      Student.countDocuments({ status: 'Admitted', is_deleted: false }),
      Student.countDocuments({ status: 'Rejected', is_deleted: false }),
      User.find({ role: 'staff' }).lean(),
    ]);

    const staffRows = await Promise.all(staffList.map(async (u) => {
      const assigned = await Student.countDocuments({ assigned_staff_id: u._id, is_deleted: false });
      const admittedCount = await Student.countDocuments({ assigned_staff_id: u._id, status: 'Admitted', is_deleted: false });
      return { name: u.name, assigned, admitted: admittedCount };
    }));

    const doc = new PDFDocument({ margin: 50 });
    res.header('Content-Type', 'application/pdf');
    res.attachment('admission-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Admission Tracker — Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').text('Overview');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Students: ${total}`);
    doc.text(`Admitted: ${admitted}`);
    doc.text(`Rejected: ${rejected}`);
    doc.text(`Conversion Rate: ${total > 0 ? Math.round(admitted / total * 100) : 0}%`);
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').text('Staff Performance');
    doc.moveDown(0.5);
    staffRows.forEach(s => {
      const rate = s.assigned > 0 ? Math.round(s.admitted / s.assigned * 100) : 0;
      doc.fontSize(11).font('Helvetica').text(`${s.name}: ${s.assigned} assigned, ${s.admitted} admitted (${rate}%)`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF export failed' });
  }
};

module.exports = { overview, conversionFunnel, leadSources, staffPerformance, trends, calendarData, exportCSV, exportPDF };
