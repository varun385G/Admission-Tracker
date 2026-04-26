const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note_text: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

noteSchema.index({ student_id: 1 });

module.exports = mongoose.model('Note', noteSchema);
