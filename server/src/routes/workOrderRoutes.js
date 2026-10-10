const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { clusterReports } = require('../engines/clusteringEngine');
const { classifySeverity, sortPrioritizedQueue } = require('../engines/severityEngine');
const {
  createCoordinatedWorkOrder,
  handlePrimaryCompletion
} = require('../engines/sequencingEngine');
const { evaluateEscalation } = require('../engines/escalationEngine');

// GET all coordinated work orders
router.get('/', (req, res) => {
  const workOrders = db.workOrders.findAll();

  // Evaluate escalation status dynamically for all work orders
  const evaluated = workOrders.map(wo => {
    const escalation = evaluateEscalation(wo);
    return {
      ...wo,
      escalation
    };
  });

  res.json({ workOrders: evaluated });
});

// GET prioritised problem queue (Step 1 clustering + Step 2 severity)
router.get('/problem-queue', (req, res) => {
  const reports = db.reports.findAll().filter(r => r.status !== 'resolved');
  
  // Step 1: Cluster reports by location (50m) and problem type
  const clusters = clusterReports(reports, 50);

  // Step 2: Classify severity for each group
  const evaluatedGroups = clusters.map(group => {
    const severityInfo = classifySeverity(group);
    return {
      ...group,
      severity: severityInfo.severity,
      severityReason: severityInfo.reason,
      priorityScore: severityInfo.priorityScore
    };
  });

  // Sort queue by severity (Major > Moderate > Minor), then reports count, then age
  const prioritizedQueue = sortPrioritizedQueue(evaluatedGroups);

  res.json({
    prioritizedQueue,
    count: prioritizedQueue.length
  });
});

// POST build a coordinated work order from clustered problem groups
router.post('/build', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const { problemGroupIds, customHandoffMinutes, adminOverrideParallel } = req.body;

  const allReports = db.reports.findAll();
  const clusters = clusterReports(allReports, 50);

  // Filter the selected clusters or use those matching the IDs
  let selectedGroups = clusters;
  if (Array.isArray(problemGroupIds) && problemGroupIds.length > 0) {
    selectedGroups = clusters.filter(c => problemGroupIds.includes(c.groupId));
  }

  if (selectedGroups.length === 0) {
    return res.status(400).json({ error: 'No matching problem groups found to sequence' });
  }

  // Classify severity before sequencing
  const groupsWithSeverity = selectedGroups.map(g => {
    const sev = classifySeverity(g);
    return { ...g, severity: sev.severity };
  });

  // Step 3: Generate Coordinated Work Order
  const handoffMinutes = customHandoffMinutes !== undefined
    ? parseInt(customHandoffMinutes, 10)
    : (db.settings.get().handoffMinutes || 60);

  const newWorkOrder = createCoordinatedWorkOrder(groupsWithSeverity, {
    handoffMinutes,
    adminOverrideParallel: !!adminOverrideParallel
  });

  if (!newWorkOrder) {
    return res.status(400).json({ error: 'Failed to generate coordinated work order' });
  }

  const saved = db.workOrders.create(newWorkOrder);

  // Update associated reports to in_progress
  for (const group of selectedGroups) {
    for (const repId of group.reportIds || []) {
      db.reports.update(repId, {
        status: 'in_progress',
        department_reply: `Coordinated Work Order ${saved.workOrderId} generated. Primary: ${saved.primaryDepartment}. Secondary: ${saved.secondaryDepartment || 'None'}.`
      });
    }
  }

  res.status(201).json({
    workOrder: saved,
    message: `Coordinated work order ${saved.workOrderId} built successfully with ${saved.totalSteps} department steps.`
  });
});

// POST primary department marks work complete -> triggers handoff to secondary
router.post('/:id/complete-primary', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const workOrder = db.workOrders.findById(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const updatedOrder = handlePrimaryCompletion(workOrder);
  db.workOrders.update(workOrder.workOrderId, updatedOrder);

  res.json({
    workOrder: updatedOrder,
    message: `Primary department work marked complete. Secondary department (${updatedOrder.secondaryDepartment}) notified to arrive at ${new Date(updatedOrder.secondaryConfirmedStartTime).toLocaleTimeString()} (after ${updatedOrder.handoffGapMinutes || 60}-minute handoff window).`
  });
});

// POST officer logs a delay explanation on overdue work order
router.patch('/:id/delay', authenticateToken, requireRole('department_officer', 'admin'), (req, res) => {
  const workOrder = db.workOrders.findById(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const { delay_reason, new_target_date } = req.body;
  if (!delay_reason || delay_reason.trim().length < 5) {
    return res.status(400).json({
      error: 'Mandatory Policy: A formal justification (delay_reason) is strictly required to log a delay on a work order.'
    });
  }

  const delayEntry = {
    timestamp: new Date().toISOString(),
    reason: delay_reason,
    new_target_date: new_target_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    authorized_by: `${req.user.name} (${req.user.designation || req.user.role})`
  };

  const steps = [...(workOrder.steps || [])];
  if (steps[0]) {
    steps[0].delay_history = [...(steps[0].delay_history || []), delayEntry];
    steps[0].targetCompletion = delayEntry.new_target_date;
  }

  const updated = db.workOrders.update(workOrder.workOrderId, {
    status: 'delayed',
    is_overdue: true,
    delay_reason,
    delay_history: [...(workOrder.delay_history || []), delayEntry],
    steps
  });

  res.json({
    workOrder: updated,
    message: `Delay logged publicly by ${req.user.name}. Secondary department notified of updated arrival expectation.`
  });
});

// POST Admin Level 2: Release secondary department to proceed in parallel
router.post('/:id/release-secondary', authenticateToken, requireRole('admin'), (req, res) => {
  const workOrder = db.workOrders.findById(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const steps = [...(workOrder.steps || [])];
  if (steps.length < 2) {
    return res.status(400).json({ error: 'No secondary department found to release' });
  }

  steps[1].status = 'in_progress';
  steps[1].parallel_override = true;
  steps[1].override_notes = `Admin executive order: Released in parallel by ${req.user.name}`;
  steps[1].scheduledStartTime = new Date().toISOString();

  const updated = db.workOrders.update(workOrder.workOrderId, {
    status: 'parallel_active',
    secondary_released_parallel: true,
    steps
  });

  res.json({
    workOrder: updated,
    message: `Level 2 Executive Action: Secondary department (${steps[1].department}) released to proceed in parallel.`
  });
});

// POST Admin Level 2: Reassign stalled work order to another contractor or department
router.post('/:id/reassign', authenticateToken, requireRole('admin'), (req, res) => {
  const workOrder = db.workOrders.findById(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const { newContractorId, newDepartmentId, notes } = req.body;
  const steps = [...(workOrder.steps || [])];

  if (steps.length > 0) {
    if (newContractorId) {
      const contractor = db.contractors.findById(newContractorId);
      if (contractor) {
        steps[0].contractorName = contractor.name;
        steps[0].contractorId = contractor.id;
      }
    }
    if (newDepartmentId) {
      const dept = db.departments.findById(newDepartmentId);
      if (dept) {
        steps[0].department = dept.name;
        steps[0].departmentId = dept.id;
      }
    }
    steps[0].reassigned_at = new Date().toISOString();
    steps[0].reassigned_by = req.user.name;
  }

  const updated = db.workOrders.update(workOrder.workOrderId, {
    status: 'reassigned',
    reassignment_notes: notes || `Reassigned by Municipal Administrator ${req.user.name}`,
    steps
  });

  res.json({
    workOrder: updated,
    message: `Level 2 Executive Action: Stalled work order successfully reassigned.`
  });
});

module.exports = router;
