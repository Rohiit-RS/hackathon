const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { optionalAuth, authenticateToken, requireRole } = require('../middleware/auth');
const { upload, handleValidatedUpload } = require('../middleware/upload');
const { isWithinCityBoundary, checkJurisdictionZone, verifyLocationConsistency } = require('../utils/geo');
const { clusterReports } = require('../engines/clusteringEngine');

// GET all reports (with optional clustering parameter)
router.get('/', optionalAuth, (req, res) => {
  const { clustered, category, ward, user_id } = req.query;
  let reports = db.reports.findAll();

  if (user_id) {
    reports = reports.filter(r => r.user_id === user_id);
  }
  if (category) {
    reports = reports.filter(r => r.category && r.category.toLowerCase() === category.toLowerCase());
  }
  if (ward) {
    reports = reports.filter(r => r.ward && r.ward.toLowerCase().includes(ward.toLowerCase()));
  }

  if (clustered === 'true') {
    const clusteredGroups = clusterReports(reports, 50);
    return res.json({ clusteredGroups, count: clusteredGroups.length });
  }

  res.json({ reports, count: reports.length });
});

// GET user's own reports ("My Reports")
router.get('/my-reports', authenticateToken, (req, res) => {
  const userReports = db.reports.findByUserId(req.user.id);
  res.json({ reports: userReports });
});

// POST submit a new citizen report
router.post(
  '/',
  authenticateToken,
  upload.any(),
  handleValidatedUpload,
  (req, res) => {
    try {
      const {
        title,
        description,
        category,
        problem_type,
        ward,
        address,
        latitude,
        longitude,
        location_source = 'live_gps', // 'exif', 'live_gps', 'manual_pin'
        exif_lat,
        exif_lng
      } = req.body;

      if (!title || !category || !latitude || !longitude) {
        return res.status(400).json({ error: 'Title, category, and valid coordinates are required.' });
      }

      // Enforce Anti-Spam Daily Rate Limit: "Maximum reports per user per day to prevent spam"
      const maxDaily = db.settings.get().maxReportsPerUserPerDay || 10;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const userRecentReports = db.reports.findByUserId(req.user.id).filter(
        r => new Date(r.created_at).getTime() > oneDayAgo
      );
      if (userRecentReports.length >= maxDaily) {
        return res.status(429).json({
          error: `Anti-Spam Rate Limit Exceeded: You have reached the maximum limit of ${maxDaily} reports per 24 hours.`
        });
      }

      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      // Check jurisdiction zone: allows Core Municipal, Greater Chennai, and all of Tamil Nadu State
      const zoneCheck = checkJurisdictionZone(parsedLat, parsedLng);
      if (!zoneCheck.isValid) {
        return res.status(400).json({
          error: zoneCheck.error || 'Invalid geographic coordinates provided.'
        });
      }

      // Check location consistency rule:
      // "If EXIF location and device GPS differ by more than 200m, the report is flagged location unverified"
      let locationVerified = true;
      let verificationNote = 'Location verified by device GPS';

      if (exif_lat && exif_lng) {
        const consistency = verifyLocationConsistency(
          parseFloat(exif_lat),
          parseFloat(exif_lng),
          parsedLat,
          parsedLng,
          200
        );
        if (!consistency.isConsistent) {
          locationVerified = false;
          verificationNote = `Flagged: ${consistency.reason}`;
        }
      }

      // Check duplicate image upload by hash
      const files = req.savedFiles || (req.file ? [req.file] : []);
      const allReports = db.reports.findAll();
      for (const file of files) {
        if (file.fileHash) {
          const duplicate = allReports.find(
            r => r.photo_hash === file.fileHash || (r.photos_hashes && r.photos_hashes.includes(file.fileHash))
          );
          if (duplicate) {
            return res.status(409).json({
              error: 'Duplicate photo detected: An identical image has already been uploaded for this issue.'
            });
          }
        }
      }

      const photos = files.map(f => f.publicUrl);
      const photoUrl = photos.length > 0
        ? photos[0]
        : 'https://images.unsplash.com/photo-1541888946425-d0fbb18626c8?auto=format&fit=crop&w=600&q=80';

      const newReport = {
        user_id: req.user.id,
        user_name: req.user.name,
        user_email: req.user.email,
        title,
        description: description || '',
        category: category.toLowerCase(),
        problem_type: problem_type || category.toLowerCase(),
        ward: ward || 'Ward 4 (Anna Nagar)',
        address: address || `${ward || 'Ward 4'}, Civic Site`,
        latitude: parsedLat,
        longitude: parsedLng,
        jurisdiction: zoneCheck.jurisdiction,
        jurisdiction_zone: zoneCheck.zone,
        jurisdiction_warning: zoneCheck.warning,
        location_source, // 'exif', 'live_gps', 'manual_pin'
        location_verified: locationVerified,
        verification_note: verificationNote,
        photo_url: photoUrl,
        photos: photos.length > 0 ? photos : [photoUrl],
        photo_hash: files[0]?.fileHash || null,
        photos_hashes: files.map(f => f.fileHash).filter(Boolean),
        status: 'submitted',
        department_reply: null,
        citizen_confirmed_resolved: false
      };

      const created = db.reports.create(newReport);
      res.status(201).json({ report: created, warning: zoneCheck.warning });
    } catch (err) {
      console.error('Error in POST /api/reports:', err);
      res.status(500).json({ error: 'Server error processing report submission' });
    }
  }
);

// PATCH officer replies to citizen report
router.patch('/:id/reply', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const report = db.reports.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const { reply, status } = req.body;
  if (!reply) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  const updates = {
    department_reply: reply,
    replied_by: req.user.name,
    replied_at: new Date().toISOString()
  };

  if (status) {
    updates.status = status;
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
  }

  const updated = db.reports.update(report.id, updates);
  res.json({ report: updated });
});

// POST citizen confirms resolution
router.post('/:id/confirm-resolution', authenticateToken, (req, res) => {
  const report = db.reports.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (report.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the citizen who filed this report can confirm resolution' });
  }

  const updated = db.reports.update(report.id, {
    citizen_confirmed_resolved: true,
    confirmed_resolved_at: new Date().toISOString(),
    status: 'resolved'
  });

  res.json({ report: updated, message: 'Resolution confirmed by resident. Thank you for your feedback!' });
});

module.exports = router;
