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
    // Default fallback to citizen
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

// Get available demo accounts
router.get('/demo-accounts', (req, res) => {
  const accounts = db.users.find(u =>
    ['citizen@demo.com', 'sewage@demo.com', 'roads@demo.com', 'admin@demo.com', 'water@demo.com'].includes(u.email)
  ).map(u => ({
    email: u.email,
    name: u.name,
    role: u.role,
    department_name: u.department_name || null,
    designation: u.designation || 'Registered Citizen'
  }));
  res.json({ accounts });
});

module.exports = router;
