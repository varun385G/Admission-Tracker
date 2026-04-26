const mongoose = require('mongoose');

const VALID_STATUSES = [
  'New Enquiry', 'Contacted', 'Counselling Scheduled',
  'Document Submitted', 'Admitted', 'Rejected', 'Not Interested'
];

const markSchema = new mongoose.Schema({
  subject: { type: String },
  max_mark: { type: Number },
  obtained_mark: { type: Number },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  name:                { type: String, required: true, maxlength: 100 },
  email:               { type: String, required: true, unique: true, lowercase: true, maxlength: 150 },
  phone:               { type: String, required: true, maxlength: 20 },
  alt_phone:           { type: String, maxlength: 20 },
  application_number:  { type: String, maxlength: 50 },
  gender:              { type: String, enum: ['Male', 'Female', 'Other'] },
  aadhar_no:           { type: String, maxlength: 12 },
  community:           { type: String, maxlength: 50 },
  caste:               { type: String, maxlength: 50 },
  status:              { type: String, enum: VALID_STATUSES, default: 'New Enquiry' },
  assigned_staff_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  twelfth_percentage:  { type: Number, min: 0, max: 100 },
  subject_marks:       { type: [markSchema], default: [] },
  total_score:         { type: Number },
  obtained_score:      { type: Number },
  counselling_date:    { type: Date },
  applied_date:        { type: Date },
  submitted_date:      { type: Date },
  next_followup_date:  { type: Date },
  lead_source:         { type: String, maxlength: 50 },
  notes:               { type: String },
  is_deleted:          { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

studentSchema.index({ status: 1 });
studentSchema.index({ assigned_staff_id: 1 });
studentSchema.index({ next_followup_date: 1 });

module.exports = mongoose.model('Student', studentSchema);