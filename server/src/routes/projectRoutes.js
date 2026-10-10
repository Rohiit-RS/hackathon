const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { optionalAuth, authenticateToken, requireRole } = require('../middleware/auth');
const { detectDigOnceConflicts } = require('../engines/digOnceEngine');

// GET all projects with filters
router.get('/', optionalAuth, (req, res) => {
  const { ward, department, status, category, search } = req.query;
  let list = db.projects.findAll();

  if (ward) {
    list = list.filter(p => p.ward && p.ward.toLowerCase().includes(ward.toLowerCase()));
  }
  if (department) {
    list = list.filter(p =>
      (p.department_name && p.department_name.toLowerCase().includes(department.toLowerCase())) ||
      (p.department_id && p.department_id.toLowerCase() === department.toLowerCase())
    );
  }
  if (category) {
    list = list.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }
  if (status) {
    list = list.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.contractor_name && p.contractor_name.toLowerCase().includes(q))
    );
  }

  res.json({ projects: list, count: list.length });
});

// GET single project detail
router.get('/:id', optionalAuth, (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Attach verifications and quorum info
  const verifications = db.verifications.findByProjectId(project.id);
  
  // Attach dig-once conflicts if any
  const allProjects = db.projects.findAll();
  const conflicts = detectDigOnceConflicts(project, allProjects);

  res.json({
    project,
    verifications,
    conflicts
  });
});

// GET dig-once conflicts for a specific project
router.get('/:id/conflicts', (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const allProjects = db.projects.findAll();
  const conflicts = detectDigOnceConflicts(project, allProjects);
  res.json({ conflicts });
});

// POST new project (officer or admin)
router.post('/', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const {
    title,
    description,
    purpose,
    category,
    department_id,
    contractor_id,
    ward,
    address,
    latitude,
    longitude,
    sanctioned_budget,
    start_date,
    expected_end_date
  } = req.body;

  if (!title || !category || !ward || !latitude || !longitude || !sanctioned_budget) {
    return res.status(400).json({ error: 'Missing required project fields' });
  }

  const dept = db.departments.findById(department_id) || db.departments.findAll()[0];
  const contractor = db.contractors.findById(contractor_id) || db.contractors.findAll()[0];

  const newProject = {
    title,
    description: description || '',
    purpose: purpose || 'Civic infrastructure improvement',
    category,
    department_id: dept.id,
    department_name: dept.name,
    contractor_id: contractor.id,
    contractor_name: contractor.name,
    ward,
    address: address || `${ward}, Civic Works Zone`,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    sanctioned_budget: parseFloat(sanctioned_budget),
    amount_spent: 0,
    maintenance_budget: Math.round(sanctioned_budget * 0.1),
    budget_variance: 0,
    variance_percentage: 0,
    start_date: start_date || new Date().toISOString().split('T')[0],
    expected_end_date: expected_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    original_end_date: expected_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Planned',
    contractor_claimed_status: 'planned',
    is_overdue: false,
    delay_reason: null,
    delay_history: [],
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18626c8?auto=format&fit=crop&w=800&q=80',
    timeline: [
      {
        date: new Date().toISOString().split('T')[0],
        title: 'Project Sanctioned & Approved',
        status: 'completed',
        details: `Initial budget of ₹${sanctioned_budget.toLocaleString()} sanctioned.`
      }
    ]
  };

  const created = db.projects.create(newProject);

  // Check for dig-once conflicts with other projects
  const allProjects = db.projects.findAll();
  const conflicts = detectDigOnceConflicts(created, allProjects);

  res.status(201).json({
    project: created,
    digOnceConflicts: conflicts,
    warning: conflicts.length > 0 ? 'Dig-Once conflict detected with nearby planned work!' : null
  });
});

// PATCH update status or extend deadline (MANDATORY DELAY REASON RULE)
router.patch('/:id/status', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { status, contractor_claimed_status, new_end_date, delay_reason, amount_spent } = req.body;
  const updates = {};

  if (amount_spent !== undefined) {
    updates.amount_spent = parseFloat(amount_spent);
    updates.budget_variance = updates.amount_spent - project.sanctioned_budget;
    updates.variance_percentage = Number(
      ((updates.budget_variance / project.sanctioned_budget) * 100).toFixed(1)
    );
  }

  // Enforce Anti-Gaming Deadline Change Rule:
  // "Every deadline change requires a reason. A delay history log is shown publicly and delayed projects get an automatic Delayed badge."
  if (new_end_date && new_end_date !== project.expected_end_date) {
    if (!delay_reason || delay_reason.trim().length < 5) {
      return res.status(400).json({
        error: 'Mandatory Policy: A formal justification (delay_reason) is strictly required to change or extend a public works deadline.'
      });
    }

    const delayEntry = {
      timestamp: new Date().toISOString(),
      old_end_date: project.expected_end_date,
      new_end_date,
      reason: delay_reason,
      authorized_by: `${req.user.name} (${req.user.designation || req.user.role})`
    };

    updates.expected_end_date = new_end_date;
    updates.delay_reason = delay_reason;
    updates.is_overdue = true;
    updates.status = 'Delayed';
    updates.delay_history = [...(project.delay_history || []), delayEntry];
    
    // Add to project timeline
    updates.timeline = [
      ...(project.timeline || []),
      {
        date: new Date().toISOString().split('T')[0],
        title: 'Deadline Revision (Delayed)',
        status: 'delayed',
        details: `Deadline extended from ${delayEntry.old_end_date} to ${new_end_date}. Reason: ${delay_reason}`
      }
    ];
  }

  if (status && status !== 'Delayed') {
    updates.status = status;
    updates.timeline = [
      ...(project.timeline || []),
      {
        date: new Date().toISOString().split('T')[0],
        title: `Status Updated to ${status}`,
        status: status.toLowerCase().replace(/[\s-]/g, '_'),
        details: `Updated by ${req.user.name}`
      }
    ];
  }

  if (contractor_claimed_status) {
    updates.contractor_claimed_status = contractor_claimed_status;
  }

  const updatedProject = db.projects.update(project.id, updates);
  res.json({ project: updatedProject });
});

module.exports = router;
