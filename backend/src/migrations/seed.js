require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin user
    const existing = await User.findOne({ email: 'admin@college.com' });
    if (!existing) {
      const hash = await bcrypt.hash('Admin@123', 12);
      await User.create({ name: 'Admin User', email: 'admin@college.com', password_hash: hash, role: 'admin', phone: '9999999999', department: 'Administration' });
      console.log('✅ Admin created: admin@college.com / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Staff users
    const staffHash = await bcrypt.hash('Staff@123', 12);
    const staffMembers = [
      { name: 'Priya Sharma', email: 'priya@college.com', department: 'Engineering' },
      { name: 'Rahul Menon', email: 'rahul@college.com', department: 'Management' },
      { name: 'Anjali Nair', email: 'anjali@college.com', department: 'Computer Science' },
    ];

    const staffIds = [];
    for (const s of staffMembers) {
      let staff = await User.findOne({ email: s.email });
      if (!staff) {
        staff = await User.create({ ...s, password_hash: staffHash, role: 'staff' });
      }
      staffIds.push(staff._id);
    }

    // Sample students
    const statuses = ['New Enquiry', 'Contacted', 'Counselling Scheduled', 'Document Submitted', 'Admitted', 'Rejected', 'Not Interested'];
    const sources = ['Walk-in', 'Online', 'Agent', 'Friend', 'Social Media'];
    const sampleStudents = [
      { name: 'Arjun Krishnan', email: 'arjun.k@example.com', phone: '9841234567', course_interested: 'B.Tech', status: 'Admitted' },
      { name: 'Meera Patel', email: 'meera.p@example.com', phone: '9842234567', course_interested: 'MBA', status: 'Counselling Scheduled' },
      { name: 'Siddharth Iyer', email: 'sid.iyer@example.com', phone: '9843234567', course_interested: 'BCA', status: 'Document Submitted' },
      { name: 'Kavya Reddy', email: 'kavya.r@example.com', phone: '9844234567', course_interested: 'MCA', status: 'Contacted' },
      { name: 'Rohan Verma', email: 'rohan.v@example.com', phone: '9845234567', course_interested: 'B.Tech', status: 'New Enquiry' },
      { name: 'Divya Subramaniam', email: 'divya.s@example.com', phone: '9846234567', course_interested: 'BBA', status: 'Rejected' },
      { name: 'Aditya Kumar', email: 'aditya.k@example.com', phone: '9847234567', course_interested: 'B.Tech', status: 'Admitted' },
      { name: 'Sneha Pillai', email: 'sneha.p@example.com', phone: '9848234567', course_interested: 'MBA', status: 'Not Interested' },
      { name: 'Karthik Nandakumar', email: 'karthik.n@example.com', phone: '9849234567', course_interested: 'BCA', status: 'Counselling Scheduled' },
      { name: 'Pooja Singh', email: 'pooja.s@example.com', phone: '9850234567', course_interested: 'B.Tech', status: 'New Enquiry' },
    ];

    const today = new Date();
    for (let i = 0; i < sampleStudents.length; i++) {
      const s = sampleStudents[i];
      const exists = await Student.findOne({ email: s.email });
      if (!exists) {
        await Student.create({
          ...s,
          assigned_staff_id: staffIds[i % staffIds.length],
          twelfth_percentage: parseFloat((70 + Math.random() * 25).toFixed(1)),
          entrance_score: parseFloat((60 + Math.random() * 35).toFixed(0)),
          lead_source: sources[i % sources.length],
          next_followup_date: i < 3 ? today : null,
        });
      }
    }

    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
