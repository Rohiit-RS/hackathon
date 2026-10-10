/**
 * Escalation Engine for CivicTrack
 * Monitors work orders and triggers Level 1 and Level 2 escalations
 * when primary departments fail to meet deadlines within configurable grace periods.
 */

const DEFAULT_GRACE_PERIODS = {
  Major: {
    expectedHours: 48,
    level1GraceHours: 24,
    level2GraceHours: 24
  },
  Moderate: {
    expectedHours: 120,
    level1GraceHours: 72,
    level2GraceHours: 72
  },
  Minor: {
    expectedHours: 336, // 14 days
    level1GraceHours: 168, // 7 days
    level2GraceHours: 168  // 7 days
  }
};

/**
 * Evaluate the escalation state of a work order
 * @param {Object} workOrder 
 * @param {Object} config Grace periods configuration
 * @param {Date} currentTime Current evaluation time
 * @returns {Object} Escalation assessment
 */
function evaluateEscalation(workOrder, config = DEFAULT_GRACE_PERIODS, currentTime = new Date()) {
  const now = new Date(currentTime).getTime();
  const primaryStep = (workOrder.steps || [])[0];

  if (!primaryStep || primaryStep.status === 'completed') {
    return {
      isOverdue: false,
      escalationLevel: 0,
      statusLabel: 'On Track',
      secondaryStatus: workOrder.steps?.[1]?.status || 'pending',
      actionsRequired: []
    };
  }

  const severity = primaryStep.problem?.severity || 'Moderate';
  const rules = config[severity] || config.Moderate;

  const startTime = new Date(workOrder.createdAt || workOrder.startDate || now).getTime();
  const expectedCompletionTime = startTime + rules.expectedHours * 60 * 60 * 1000;
  const level1Deadline = expectedCompletionTime + rules.level1GraceHours * 60 * 60 * 1000;
  const level2Deadline = level1Deadline + rules.level2GraceHours * 60 * 60 * 1000;

  if (now < expectedCompletionTime) {
    return {
      isOverdue: false,
      escalationLevel: 0,
      expectedCompletionDate: new Date(expectedCompletionTime).toISOString(),
      hoursRemaining: Math.round((expectedCompletionTime - now) / (1000 * 60 * 60)),
      statusLabel: 'In Progress',
      secondaryStatus: 'Pending Primary Completion',
      actionsRequired: []
    };
  }

  // Primary has passed expected completion
  const hoursOverdue = Math.round((now - expectedCompletionTime) / (1000 * 60 * 60));

  if (now >= level2Deadline) {
    return {
      isOverdue: true,
      escalationLevel: 2,
      hoursOverdue,
      escalationTarget: 'Municipal Commissioner / Admin',
      statusLabel: 'CRITICAL DELAY - Escalated to Commissioner',
      badge: 'Delayed',
      badgeColor: 'red',
      secondaryStatus: 'Held in Pending (Secondary Protected from Redundant Digging)',
      actionsRequired: [
        'Mandatory delay justification required from Department Officer',
        'Admin authority granted: Reassign contractor or release secondary in parallel'
      ]
    };
  }

  if (now >= level1Deadline) {
    return {
      isOverdue: true,
      escalationLevel: 1,
      hoursOverdue,
      escalationTarget: 'Primary Department Head (Executive Engineer)',
      statusLabel: 'OVERDUE - Escalated to Dept Head',
      badge: 'Delayed',
      badgeColor: 'amber',
      secondaryStatus: 'Held in Pending (Secondary Notified to Delay Arrival)',
      actionsRequired: [
        'Department Head notified for immediate site inspection',
        'Officer must provide revised timeline and official delay cause'
      ]
    };
  }

  // Inside grace period window
  return {
    isOverdue: true,
    escalationLevel: 0.5, // In initial grace window
    hoursOverdue,
    statusLabel: 'Deadline Passed (In Grace Period)',
    badge: 'Delayed',
    badgeColor: 'yellow',
    secondaryStatus: 'Pending (Standing by)',
    actionsRequired: [
      'Officer advised to update expected completion date and log reason'
    ]
  };
}

module.exports = {
  DEFAULT_GRACE_PERIODS,
  evaluateEscalation
};
