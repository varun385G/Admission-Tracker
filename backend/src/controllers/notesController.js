const Note = require('../models/Note');
const Student = require('../models/Student');

const sanitize = (str) => str ? str.replace(/<[^>]*>/g, '').trim() : str;

const createNote = async (req, res) => {
  const { student_id, note_text } = req.body;

  try {
    const student = await Student.findOne({ _id: student_id, is_deleted: false });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (req.user.role === 'staff' && student.assigned_staff_id?.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const note = await Note.create({ student_id, staff_id: req.user.id, note_text: sanitize(note_text) });
    const populated = await Note.findById(note._id).populate('staff_id', 'name role').lean();

    res.status(201).json({
      note: {
        ...populated,
        id: populated._id,
        author_name: populated.staff_id?.name,
        author_role: populated.staff_id?.role,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getNotesForStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const notes = await Note.find({ student_id: studentId })
      .populate('staff_id', 'name role')
      .sort({ created_at: -1 })
      .lean();

    const result = notes.map(n => ({
      ...n,
      id: n._id,
      author_name: n.staff_id?.name,
      author_role: n.staff_id?.role,
    }));

    res.json({ notes: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createNote, getNotesForStudent };
