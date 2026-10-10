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
  const {
    ward,
    title,
    message,
    category,
    affected_roads,
    start_date,
    end_date,
    severity,
    who_is_digging,
    why,
    alternative_routes,
    contact_details
  } = req.body;

  if (!title || !message || !ward) {
    return res.status(400).json({ error: 'Title, message, and ward are required' });
  }

  const newAlert = {
    ward,
    title,
    message,
    category: category || 'roads',
    affected_roads: Array.isArray(affected_roads)
      ? affected_roads
      : typeof affected_roads === 'string'
      ? affected_roads.split(',').map(r => r.trim()).filter(Boolean)
      : ['Local Roadways'],
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    severity: severity || 'Moderate',
    who_is_digging: who_is_digging || req.user.department || req.user.name,
    why: why || message,
    alternative_routes: alternative_routes || 'Follow detour signage via adjacent arterial links',
    contact_details: contact_details || 'Field Control Desk: 1800-425-1234',
    created_by: req.user.name
  };

  const created = db.alerts.create(newAlert);
  res.status(201).json({ alert: created });
});

// POST subscribe to ward / commute route alerts
router.post('/subscribe', authenticateToken, (req, res) => {
  const { ward, commuteRoute } = req.body;
  if (!ward) {
    return res.status(400).json({ error: 'Ward is required to subscribe' });
  }

  const user = db.users.findById(req.user.id);
  if (user) {
    const existing = user.subscribedWards || [];
    if (!existing.includes(ward)) {
      existing.push(ward);
    }
    db.users.update(user.id, {
      subscribedWards: existing,
      commuteRoute: commuteRoute || user.commuteRoute || ''
    });
  }

  res.json({
    message: `Subscribed successfully to 48-hour dig advisories for ${ward}`,
    ward,
    commuteRoute: commuteRoute || ''
  });
});

module.exports = router;
