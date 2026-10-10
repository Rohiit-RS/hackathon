const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateEscalation } = require('../src/engines/escalationEngine');

test('Escalation Engine - work on time is marked on track and secondary remains pending', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const workOrder = {
    createdAt: '2026-10-10T08:00:00Z', // 4 hours ago
    steps: [
      { role: 'Primary', status: 'in_progress', problem: { severity: 'Major' } },
      { role: 'Secondary', status: 'pending' }
    ]
  };

  const evalResult = evaluateEscalation(workOrder, undefined, now);
  assert.equal(evalResult.isOverdue, false);
  assert.equal(evalResult.escalationLevel, 0);
  assert.equal(evalResult.secondaryStatus, 'Pending Primary Completion');
});

test('Escalation Engine - escalates to Level 1 (Dept Head) when grace period passes', () => {
  const startTime = new Date('2026-10-01T00:00:00Z');
  // Major: 48h expected + 24h grace = 72h. Let's test at 80h.
  const evaluationTime = new Date(startTime.getTime() + 80 * 60 * 60 * 1000);

  const workOrder = {
    createdAt: startTime.toISOString(),
    steps: [
      { role: 'Primary', status: 'in_progress', problem: { severity: 'Major' } },
      { role: 'Secondary', status: 'pending' }
    ]
  };

  const evalResult = evaluateEscalation(workOrder, undefined, evaluationTime);
  assert.equal(evalResult.isOverdue, true);
  assert.equal(evalResult.escalationLevel, 1);
  assert.match(evalResult.escalationTarget, /Primary Department Head/);
  assert.equal(evalResult.badge, 'Delayed');
});

test('Escalation Engine - escalates to Level 2 (Commissioner/Admin) when secondary grace period passes', () => {
  const startTime = new Date('2026-10-01T00:00:00Z');
  // Major: 48h + 24h + 24h = 96h. Test at 100 hours.
  const evaluationTime = new Date(startTime.getTime() + 100 * 60 * 60 * 1000);

  const workOrder = {
    createdAt: startTime.toISOString(),
    steps: [
      { role: 'Primary', status: 'in_progress', problem: { severity: 'Major' } },
      { role: 'Secondary', status: 'pending' }
    ]
  };

  const evalResult = evaluateEscalation(workOrder, undefined, evaluationTime);
  assert.equal(evalResult.isOverdue, true);
  assert.equal(evalResult.escalationLevel, 2);
  assert.match(evalResult.escalationTarget, /Municipal Commissioner \/ Admin/);
});
