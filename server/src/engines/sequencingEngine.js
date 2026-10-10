/**
 * Sequencing Engine for CivicTrack
 * Builds coordinated work orders across multiple departments at the same site.
 * Underground first -> surface last.
 * Includes deterministic tie-breaker and 1-hour handoff gap scheduling.
 */

// Configurable standard municipal depth/dependency order
// Lower number = deeper underground / must execute first
const DEFAULT_DEPARTMENT_HIERARCHY = {
  sewage: { tier: 1, name: 'Sewage Department', label: 'Underground Deep' },
  water: { tier: 1, name: 'Water Works Department', label: 'Underground Deep' },
  drainage: { tier: 2, name: 'Storm Drainage Department', label: 'Underground Mid' },
  electricity: { tier: 3, name: 'Electricity Board', label: 'Utility Conduit' },
  telecom: { tier: 3, name: 'Telecom & Fiber Authority', label: 'Utility Conduit' },
  roads: { tier: 4, name: 'Roads & Highways Department', label: 'Surface Pavement' }
};

const DEFAULT_HANDOFF_GAP_MINUTES = 60; // 1 hour gap

/**
 * Determine the order between two problems at the same dependency tier
 * Tie-break rules:
 * 1. Higher severity group first
 * 2. Work already in progress first
 * 3. More citizen reports first
 * 4. Older problem first (earliest timestamp)
 * 5. Admin override / Lower department ID
 */
function resolveTierTieBreak(probA, probB, adminOverrideParallel = false) {
  if (adminOverrideParallel) {
    return {
      order: [probA, probB],
      parallel: true,
      reason: 'Admin marked jobs as parallel non-conflicting ducts'
    };
  }

  const severityRank = { Major: 3, Moderate: 2, Minor: 1 };
  const rankA = severityRank[probA.severity] || 1;
  const rankB = severityRank[probB.severity] || 1;

  if (rankA !== rankB) {
    const winner = rankA > rankB ? probA : probB;
    const loser = rankA > rankB ? probB : probA;
    return {
      order: [winner, loser],
      parallel: false,
      reason: `${winner.departmentName || winner.category} first: higher severity (${winner.severity} vs ${loser.severity})`
    };
  }

  // Rule 2: Work already in progress first
  if (probA.status === 'in_progress' && probB.status !== 'in_progress') {
    return {
      order: [probA, probB],
      parallel: false,
      reason: `${probA.departmentName || probA.category} first: work already in progress on site`
    };
  }
  if (probB.status === 'in_progress' && probA.status !== 'in_progress') {
    return {
      order: [probB, probA],
      parallel: false,
      reason: `${probB.departmentName || probB.category} first: work already in progress on site`
    };
  }

  // Rule 3: More citizen reports first
  const countA = probA.reportCount || 1;
  const countB = probB.reportCount || 1;
  if (countA !== countB) {
    const winner = countA > countB ? probA : probB;
    const loser = countA > countB ? probB : probA;
    return {
      order: [winner, loser],
      parallel: false,
      reason: `${winner.departmentName || winner.category} first: higher citizen complaint count (${winner.reportCount} vs ${loser.reportCount})`
    };
  }

  // Rule 4: Older problem first
  const timeA = new Date(probA.earliestReportDate || 0).getTime();
  const timeB = new Date(probB.earliestReportDate || 0).getTime();
  if (timeA !== timeB) {
    const winner = timeA < timeB ? probA : probB;
    return {
      order: [winner, winner === probA ? probB : probA],
      parallel: false,
      reason: `${winner.departmentName || winner.category} first: earlier reported issue date`
    };
  }

  // Rule 5: Fallback to lower department ID
  const idA = String(probA.departmentId || probA.category);
  const idB = String(probB.departmentId || probB.category);
  const winner = idA.localeCompare(idB) <= 0 ? probA : probB;
  return {
    order: [winner, winner === probA ? probB : probA],
    parallel: false,
    reason: `${winner.departmentName || winner.category} first: deterministic identifier tie-breaker`
  };
}

/**
 * Build a Coordinated Work Order for multiple problems at a location
 * @param {Array} problemGroups Problems at this location
 * @param {Object} options Configuration overrides
 * @returns {Object} Coordinated Work Order specification
 */
function createCoordinatedWorkOrder(problemGroups, options = {}) {
  const hierarchy = options.hierarchy || DEFAULT_DEPARTMENT_HIERARCHY;
  const handoffMinutes = options.handoffMinutes ?? DEFAULT_HANDOFF_GAP_MINUTES;

  if (!problemGroups || problemGroups.length === 0) {
    return null;
  }

  // Decorate problems with hierarchy tier
  const decorated = problemGroups.map(p => {
    const cat = (p.category || 'roads').toLowerCase();
    const config = hierarchy[cat] || { tier: 3, name: p.category, label: 'General Utility' };
    return {
      ...p,
      tier: config.tier,
      departmentName: config.name,
      tierLabel: config.label
    };
  });

  // Sort primarily by tier (underground tier 1 first, surface tier 4 last)
  decorated.sort((a, b) => a.tier - b.tier);

  // Group by tier to detect same-tier ties
  const sequencedSteps = [];
  let currentStep = 1;
  let tieBreakReason = null;

  for (let i = 0; i < decorated.length; i++) {
    const current = decorated[i];
    const next = decorated[i + 1];

    if (next && current.tier === next.tier) {
      // Tie-break needed between current and next
      const resolved = resolveTierTieBreak(current, next, options.adminOverrideParallel);
      tieBreakReason = resolved.reason;

      sequencedSteps.push({
        stepOrder: currentStep++,
        role: sequencedSteps.length === 0 ? 'Primary' : 'Secondary',
        problem: resolved.order[0],
        department: resolved.order[0].departmentName,
        category: resolved.order[0].category,
        tier: resolved.order[0].tier,
        tieBreakReason: resolved.reason,
        status: sequencedSteps.length === 0 ? 'in_progress' : 'pending'
      });

      sequencedSteps.push({
        stepOrder: currentStep++,
        role: 'Secondary',
        problem: resolved.order[1],
        department: resolved.order[1].departmentName,
        category: resolved.order[1].category,
        tier: resolved.order[1].tier,
        tieBreakReason: `Scheduled after ${resolved.order[0].departmentName} (${resolved.reason})`,
        status: 'pending'
      });

      i++; // skip next since handled in pair
    } else {
      sequencedSteps.push({
        stepOrder: currentStep++,
        role: sequencedSteps.length === 0 ? 'Primary' : 'Secondary',
        problem: current,
        department: current.departmentName,
        category: current.category,
        tier: current.tier,
        tieBreakReason: sequencedSteps.length === 0 ? 'Primary underground utility priority' : 'Surface restoration sequential dependency',
        status: sequencedSteps.length === 0 ? 'in_progress' : 'pending'
      });
    }
  }

  const primaryStep = sequencedSteps[0];
  const secondarySteps = sequencedSteps.slice(1);

  return {
    workOrderId: `WO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    locationAddress: problemGroups[0].address || 'Civic Work Site',
    ward: problemGroups[0].ward || 'Ward 1',
    latitude: problemGroups[0].latitude,
    longitude: problemGroups[0].longitude,
    handoffGapMinutes: handoffMinutes,
    status: 'active',
    primaryDepartment: primaryStep.department,
    primaryCategory: primaryStep.category,
    secondaryDepartment: secondarySteps.length > 0 ? secondarySteps[0].department : null,
    totalSteps: sequencedSteps.length,
    steps: sequencedSteps,
    tieBreakReason: tieBreakReason || 'Dependency hierarchy: Underground first, Surface last',
    createdAt: new Date().toISOString(),
    primaryExpectedDurationHours: primaryStep.problem.severity === 'Major' ? 48 : primaryStep.problem.severity === 'Moderate' ? 24 : 12
  };
}

/**
 * Handle transition when primary department marks work complete
 * Automatically schedules secondary department to start after handoff gap (default 1 hr)
 */
function handlePrimaryCompletion(workOrder, completedTimestamp = new Date().toISOString()) {
  const steps = [...workOrder.steps];
  if (steps.length === 0) return workOrder;

  const completedTime = new Date(completedTimestamp).getTime();
  const scheduledSecondaryStart = new Date(
    completedTime + (workOrder.handoffGapMinutes || 60) * 60 * 1000
  ).toISOString();

  // Mark step 1 completed
  steps[0].status = 'completed';
  steps[0].completedAt = completedTimestamp;

  // Notify and schedule step 2
  if (steps.length > 1) {
    steps[1].status = 'scheduled';
    steps[1].scheduledStartTime = scheduledSecondaryStart;
    steps[1].notificationSent = true;
    steps[1].notificationMessage = `Automatic Handoff: Primary work by ${steps[0].department} completed at ${new Date(completedTimestamp).toLocaleTimeString()}. Your team is scheduled to commence at ${new Date(scheduledSecondaryStart).toLocaleTimeString()} (1-hour gap elapsed).`;
  }

  return {
    ...workOrder,
    steps,
    status: steps.length > 1 ? 'handoff_in_progress' : 'completed',
    secondaryConfirmedStartTime: steps.length > 1 ? scheduledSecondaryStart : null
  };
}

module.exports = {
  DEFAULT_DEPARTMENT_HIERARCHY,
  DEFAULT_HANDOFF_GAP_MINUTES,
  resolveTierTieBreak,
  createCoordinatedWorkOrder,
  handlePrimaryCompletion
};
