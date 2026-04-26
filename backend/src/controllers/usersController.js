const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const { logAudit } = require('../utils/logger');

const sanitize = (str) => str ? str.replace(/<[^>]*>/g, '').trim() : str;

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 }).lean();

    const result = await Promise.all(users.map(async (u) => {
      const student_count = await Student.countDocuments({ assigned_staff_id: u._id, is_deleted: false });
      return { ...u, id: u._id, student_count };
    }));

    res.json({ users: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, phone, department } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'Staff@123', 12);
    const user = await User.create({
      name: sanitize(name), email, password_hash: hash,
      role: role || 'staff', phone, department: sanitize(department)
    });

    await logAudit({ user_id: req.user.id, action: 'CREATE_USER', entity_type: 'user', entity_id: user._id, ip_address: req.ip });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, is_active: user.is_active } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, department, role, password } = req.body;
  try {
    const update = { name: sanitize(name), phone, department: sanitize(department), role };
    if (password) update.password_hash = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, is_active: user.is_active } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const toggleActive = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.is_active = !user.is_active;
    await user.save();

    await logAudit({ user_id: req.user.id, action: 'TOGGLE_USER_ACTIVE', entity_type: 'user', entity_id: id, ip_address: req.ip });
    res.json({ user: { id: user._id, name: user.name, is_active: user.is_active } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id.toString()) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUsers, createUser, updateUser, toggleActive, deleteUser };
