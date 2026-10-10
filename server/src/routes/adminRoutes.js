const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET system configuration
router.get('/config', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({
    settings: db.settings.get(),
    departments: db.departments.findAll(),
    contractors: db.contractors.findAll()
  });
});

// PATCH update system configuration (grace periods, verification radius, handoff gap, rate limits)
router.patch('/config', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    handoffMinutes,
    verificationRadiusMeters,
    quorumThreshold,
    maxPhotoSizeMB,
    maxReportsPerUserPerDay,
    maxVerificationsPerUserPerDay,
    gracePeriods,
    severityThresholds
  } = req.body;
  const updates = {};

  if (handoffMinutes !== undefined) updates.handoffMinutes = parseInt(handoffMinutes, 10);
  if (verificationRadiusMeters !== undefined) updates.verificationRadiusMeters = parseInt(verificationRadiusMeters, 10);
  if (quorumThreshold !== undefined) updates.quorumThreshold = parseInt(quorumThreshold, 10);
  if (maxPhotoSizeMB !== undefined) updates.maxPhotoSizeMB = parseInt(maxPhotoSizeMB, 10);
  if (maxReportsPerUserPerDay !== undefined) updates.maxReportsPerUserPerDay = parseInt(maxReportsPerUserPerDay, 10);
  if (maxVerificationsPerUserPerDay !== undefined) updates.maxVerificationsPerUserPerDay = parseInt(maxVerificationsPerUserPerDay, 10);
  if (gracePeriods) updates.gracePeriods = gracePeriods;
  if (severityThresholds) updates.severityThresholds = severityThresholds;

  const updatedSettings = db.settings.update(updates);
  res.json({
    settings: updatedSettings,
    message: 'Configuration successfully updated by Municipal Administrator'
  });
});

// POST add a municipal department
router.post('/departments', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, category, tier, tier_label, head_name, head_email, phone } = req.body;
  if (!name || !category || !tier) {
    return res.status(400).json({ error: 'Name, category, and depth tier are required.' });
  }

  const newDept = db.departments.create({
    name,
    category: category.toLowerCase(),
    tier: parseInt(tier, 10),
    tier_label: tier_label || `Tier ${tier}`,
    head_name: head_name || 'Department Officer',
    head_email: head_email || `${category.toLowerCase()}@demo.com`,
    phone: phone || '044-27221000'
  });

  res.status(201).json({
    department: newDept,
    message: `Department '${newDept.name}' registered into coordination hierarchy.`
  });
});

// POST add a contractor
router.post('/contractors', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, license_no, rating, contact_person, phone } = req.body;
  if (!name || !license_no) {
    return res.status(400).json({ error: 'Contractor name and PWD license number are required.' });
  }

  const newContractor = db.contractors.create({
    name,
    license_no,
    rating: rating ? parseFloat(rating) : 4.5,
    contact_person: contact_person || 'Managing Director',
    phone: phone || '+91 98840 00000'
  });

  res.status(201).json({
    contractor: newContractor,
    message: `Contractor '${newContractor.name}' accredited for public works.`
  });
});

// GET all disputed projects for Admin / Commissioner review
router.get('/disputes', authenticateToken, requireRole('admin', 'department_officer'), (req, res) => {
  const disputedProjects = db.projects.findAll().filter(p => p.status === 'Disputed');
  const details = disputedProjects.map(p => {
    const verifications = db.verifications.findByProjectId(p.id);
    return {
      project: p,
      verifications,
      disputeCount: verifications.filter(v => v.status_voted === 'not_completed').length
    };
  });

  res.json({ disputes: details });
});

// POST resolve a project dispute
router.post('/disputes/:id/resolve', authenticateToken, requireRole('admin'), (req, res) => {
  const { resolutionAction, notes, newContractorId } = req.body;
  // resolutionAction: 'reopen_work' | 'confirm_completed' | 'reassign_contractor'
  const project = db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updates = {
    dispute_resolved_at: new Date().toISOString(),
    dispute_resolution_notes: notes || 'Admin resolved dispute after field review'
  };

  if (resolutionAction === 'confirm_completed') {
    updates.status = 'Citizen-confirmed';
    updates.contractor_claimed_status = 'completed';
  } else if (resolutionAction === 'reassign_contractor' && newContractorId) {
    const newCont = db.contractors.findById(newContractorId);
    if (newCont) {
      updates.contractor_id = newCont.id;
      updates.contractor_name = newCont.name;
    }
    updates.status = 'In Progress';
    updates.contractor_claimed_status = 'in_progress';
  } else {
    // reopen work
    updates.status = 'In Progress';
    updates.contractor_claimed_status = 'in_progress';
  }

  const updatedProject = db.projects.update(project.id, updates);
  res.json({
    project: updatedProject,
    message: `Dispute resolved with action '${resolutionAction}'`
  });
});

module.exports = router;
