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

// GET escalation status of a work order
router.get('/:id/escalation', (req, res) => {
  const workOrder = db.workOrders.findById(req.params.id);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const escalation = evaluateEscalation(workOrder);
  res.json({ escalation });
});

module.exports = router;
