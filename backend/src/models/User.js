const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, maxlength: 150 },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  phone: { type: String, maxlength: 20 },
  department: { type: String, maxlength: 100 },
  is_active: { type: Boolean, default: true },
  failed_login_attempts: { type: Number, default: 0 },
  locked_until: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);
