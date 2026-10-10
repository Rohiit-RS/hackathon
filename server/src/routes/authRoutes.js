const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ward: user.ward,
      department_id: user.department_id,
      department_name: user.department_name,
      designation: user.designation,
      phone: user.phone
    }
  });
});

// Register new user account with profession & department options
router.post('/register', (req, res) => {
  const {
    name,
    email,
    password,
    role = 'citizen',
    profession,
    department_id,
    department_name,
    contractor_name,
    ward,
    phone,
    designation
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.users.findByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  // Map profession to role if profession provided
  let userRole = role;
  if (profession === 'officer' || profession === 'engineer' || profession === 'department_officer') {
    userRole = 'department_officer';
  } else if (profession === 'contractor') {
    userRole = 'contractor';
  } else if (profession === 'admin') {
    userRole = 'admin';
  }

  const newUser = {
    name,
    email: email.toLowerCase(),
    password,
    role: userRole,
    profession: profession || userRole,
    department_id: department_id || null,
    department_name: department_name || null,
    contractor_name: contractor_name || null,
    ward: ward || 'Ward 4 (Anna Nagar)',
    phone: phone || '+91 98400 00000',
    designation: designation || (userRole === 'citizen' ? 'Registered Citizen' : userRole === 'admin' ? 'Administrative Officer' : 'Field Engineer')
  };

  const created = db.users.create(newUser);
  const token = generateToken(created);

  res.status(201).json({
    token,
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      profession: created.profession,
      ward: created.ward,
      department_id: created.department_id,
      department_name: created.department_name,
      contractor_name: created.contractor_name,
      designation: created.designation,
      phone: created.phone
    }
  });
});

// Demo account instant role switcher
router.post('/demo-switch', (req, res) => {
  const { role, email } = req.body;
  let targetUser;

  if (email) {
    targetUser = db.users.findByEmail(email);
  } else if (role) {
    targetUser = db.users.findOne(u => u.role === role);
  }

  if (!targetUser) {
    targetUser = db.users.findByEmail('citizen@demo.com');
  }

  const token = generateToken(targetUser);
  res.json({
    token,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      ward: targetUser.ward,
      department_id: targetUser.department_id,
      department_name: targetUser.department_name,
      designation: targetUser.designation,
      phone: targetUser.phone
    }
  });
});

// Get current profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Get available demo accounts with demo passwords
router.get('/demo-accounts', (req, res) => {
  const accounts = db.users.find(u =>
    ['citizen@demo.com', 'sewage@demo.com', 'roads@demo.com', 'admin@demo.com', 'water@demo.com'].includes(u.email)
  ).map(u => ({
    email: u.email,
    password: u.password || 'demo1234',
    name: u.name,
    role: u.role,
    department_name: u.department_name || null,
    designation: u.designation || 'Registered Citizen'
  }));
  res.json({ accounts });
});

module.exports = router;
