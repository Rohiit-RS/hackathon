const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createCoordinatedWorkOrder,
  handlePrimaryCompletion,
  resolveTierTieBreak
} = require('../src/engines/sequencingEngine');

test('Sequencing Engine - puts Underground utility before Surface road restoration', () => {
  const problems = [
    {
      category: 'roads',
      problemType: 'pothole',
      severity: 'Moderate',
      reportCount: 4,
      address: '3rd Main Rd'
    },
    {
      category: 'sewage',
      problemType: 'sewage leak',
      severity: 'Major',
      reportCount: 3,
      address: '3rd Main Rd'
    }
  ];

  const workOrder = createCoordinatedWorkOrder(problems);
  assert.equal(workOrder.steps[0].category, 'sewage', 'Sewage (Tier 1) must be Primary');
  assert.equal(workOrder.steps[1].category, 'roads', 'Roads (Tier 4) must be Secondary');
  assert.equal(workOrder.steps[0].role, 'Primary');
  assert.equal(workOrder.steps[1].role, 'Secondary');
});

test('Sequencing Engine - resolves same-tier tie breaks deterministically', () => {
  const electricityProb = {
    category: 'electricity',
    departmentName: 'Electricity Board',
    severity: 'Major',
    reportCount: 2
  };
  const telecomProb = {
    category: 'telecom',
    departmentName: 'Telecom Authority',
    severity: 'Moderate',
    reportCount: 5
  };

  const resolved = resolveTierTieBreak(electricityProb, telecomProb);
  assert.equal(resolved.order[0].category, 'electricity', 'Higher severity (Major) wins tier tie-break');
  assert.match(resolved.reason, /higher severity/);
});

test('Sequencing Engine - marks secondary department for 1 hour after primary completes', () => {
  const problems = [
    { category: 'sewage', problemType: 'leak', severity: 'Major' },
    { category: 'roads', problemType: 'patch', severity: 'Moderate' }
  ];

  const workOrder = createCoordinatedWorkOrder(problems, { handoffMinutes: 60 });
  const completedAt = '2026-10-10T14:00:00.000Z';

  const updatedOrder = handlePrimaryCompletion(workOrder, completedAt);
  assert.equal(updatedOrder.steps[0].status, 'completed');
  assert.equal(updatedOrder.steps[1].status, 'scheduled');
  assert.equal(updatedOrder.secondaryConfirmedStartTime, '2026-10-10T15:00:00.000Z');
  assert.match(updatedOrder.steps[1].notificationMessage, /Automatic Handoff/);
});
