const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleValidatedUpload } = require('../middleware/upload');
const {
  validateVerificationAttempt,
  evaluateProjectQuorumAndDisputes
} = require('../engines/trustEngine');

// POST submit a progress verification vote
router.post(
  '/',
  authenticateToken,
  upload.single('photo'),
  handleValidatedUpload,
  (req, res) => {
    try {
      const {
        project_id,
        status_voted, // 'in_progress', 'completed', 'not_completed'
        latitude,
        longitude,
        gps_accuracy = 10,
        comments
      } = req.body;

      if (!project_id || !status_voted || !latitude || !longitude) {
        return res.status(400).json({ error: 'Project ID, status vote, and live GPS coordinates are required.' });
      }

      const project = db.projects.findById(project_id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const photoUrl = req.file
        ? req.file.publicUrl
        : req.body.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb18626c8?auto=format&fit=crop&w=600&q=80';

      const existingVerifications = db.verifications.findAll();

      // Enforce anti-gaming trust rules
      const validation = validateVerificationAttempt({
        user: req.user,
        project,
        existingUserVerifications: existingVerifications,
        claimedStatus: status_voted,
        liveLat: parseFloat(latitude),
        liveLng: parseFloat(longitude),
        gpsAccuracy: parseFloat(gps_accuracy),
        photoUrl,
        config: {
          MAX_VERIFICATION_DISTANCE_METERS: db.settings.get().verificationRadiusMeters || 200,
          MAX_ALLOWED_GPS_ACCURACY_METERS: 50,
          QUORUM_THRESHOLD: db.settings.get().quorumThreshold || 3
        }
      });

      if (!validation.allowed) {
        return res.status(403).json({
          error: validation.reason,
          distanceMeters: validation.distanceMeters
        });
      }

      // Record audit verification
      const verificationRecord = {
        project_id,
        user_id: req.user.id,
        user_name: req.user.name,
        user_role: req.user.role,
        status_voted,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        gps_accuracy: parseFloat(gps_accuracy),
        distance_meters: validation.distanceMeters,
        photo_url: photoUrl,
        comments: comments || ''
      };

      const createdVerification = db.verifications.create(verificationRecord);

      // Re-evaluate project quorum and conflict/dispute state
      const allProjectVerifications = db.verifications.findByProjectId(project.id);
      const quorumStatus = evaluateProjectQuorumAndDisputes(
        project,
        allProjectVerifications,
        db.settings.get().quorumThreshold || 3
      );

      // If status changed to Citizen-confirmed or Disputed, update project
      if (quorumStatus.status !== project.status) {
        db.projects.update(project.id, {
          status: quorumStatus.status,
          quorum_status: quorumStatus
        });
      }

      res.status(201).json({
        verification: createdVerification,
        quorumStatus,
        message: quorumStatus.isDisputed
          ? 'Notice: Discrepancy logged. Your report conflicts with contractor claim and has been flagged as Disputed for officer review.'
          : quorumStatus.quorumReached
          ? 'Quorum reached! Project status updated to Citizen-confirmed.'
          : `Verification logged (${quorumStatus.completedVotes}/${db.settings.get().quorumThreshold} completed votes required for quorum).`
      });
    } catch (err) {
      console.error('Error in POST /api/verifications:', err);
      res.status(500).json({ error: 'Server error processing verification vote' });
    }
  }
);

// GET verifications for a specific project
router.get('/project/:id', (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const verifications = db.verifications.findByProjectId(project.id);
  const quorumStatus = evaluateProjectQuorumAndDisputes(
    project,
    verifications,
    db.settings.get().quorumThreshold || 3
  );

  res.json({
    verifications,
    quorumStatus
  });
});

module.exports = router;
