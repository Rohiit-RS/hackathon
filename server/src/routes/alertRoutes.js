const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all area alerts and closures
router.get('/', (req, res) => {
  const { ward } = req.query;
  let alerts = db.alerts.findAll();
  if (ward) {
    alerts = alerts.filter(a => a.ward && a.ward.toLowerCase().includes(ward.toLowerCase()));
  }
  res.json({ alerts });
});

// POST create a new area alert (officer or admin)
router.post('/', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const { ward, title, message, category, affected_roads, start_date, end_date, severity } = req.body;

  if (!title || !message || !ward) {
    return res.status(400).json({ error: 'Title, message, and ward are required' });
  }

  const newAlert = {
    ward,
    title,
    message,
    category: category || 'roads',
    affected_roads: Array.isArray(affected_roads) ? affected_roads : [affected_roads || 'Local Roadways'],
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    severity: severity || 'Moderate',
    created_by: req.user.name
  };

  const created = db.alerts.create(newAlert);
  res.status(201).json({ alert: created });
});

module.exports = router;
