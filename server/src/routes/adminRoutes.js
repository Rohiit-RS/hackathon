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

// PATCH update system configuration (grace periods, verification radius, handoff gap)
router.patch('/config', authenticateToken, requireRole('admin'), (req, res) => {
  const { handoffMinutes, verificationRadiusMeters, quorumThreshold, maxPhotoSizeMB } = req.body;
  const updates = {};

  if (handoffMinutes !== undefined) updates.handoffMinutes = parseInt(handoffMinutes, 10);
  if (verificationRadiusMeters !== undefined) updates.verificationRadiusMeters = parseInt(verificationRadiusMeters, 10);
  if (quorumThreshold !== undefined) updates.quorumThreshold = parseInt(quorumThreshold, 10);
  if (maxPhotoSizeMB !== undefined) updates.maxPhotoSizeMB = parseInt(maxPhotoSizeMB, 10);

  const updatedSettings = db.settings.update(updates);
  res.json({
    settings: updatedSettings,
    message: 'Configuration successfully updated by Municipal Administrator'
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
