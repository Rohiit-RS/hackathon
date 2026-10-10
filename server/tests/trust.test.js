const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateVerificationAttempt,
  evaluateProjectQuorumAndDisputes
} = require('../src/engines/trustEngine');

test('Trust Engine - rejects verification if user is outside 200m radius', () => {
  const user = { id: 'u1', role: 'citizen' };
  const project = { id: 'p1', latitude: 12.834200, longitude: 79.703600 };
  
  // Coordinates ~ 400m away
  const liveLat = 12.837800;
  const liveLng = 79.703600;

  const result = validateVerificationAttempt({
    user,
    project,
    existingUserVerifications: [],
    claimedStatus: 'completed',
    liveLat,
    liveLng,
    gpsAccuracy: 10,
    photoUrl: 'https://example.com/site.jpg'
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Location check failed/);
});

test('Trust Engine - blocks department officer from self-verifying their own department', () => {
  const officer = { id: 'off1', role: 'department_officer', department_id: 'dept_sewage' };
  const project = { id: 'p1', department_id: 'dept_sewage', latitude: 12.834200, longitude: 79.703600 };

  const result = validateVerificationAttempt({
    user: officer,
    project,
    existingUserVerifications: [],
    claimedStatus: 'completed',
    liveLat: 12.834210,
    liveLng: 79.703610,
    gpsAccuracy: 5,
    photoUrl: 'https://example.com/site.jpg'
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Department officers cannot verify/);
});

test('Trust Engine - requires quorum of 3 distinct citizens before Citizen-confirmed', () => {
  const project = { id: 'p1', status: 'In Progress' };
  
  // 2 verifications only
  const twoVerifications = [
    { user_id: 'u1', status_voted: 'completed' },
    { user_id: 'u2', status_voted: 'completed' }
  ];
  const eval2 = evaluateProjectQuorumAndDisputes(project, twoVerifications, 3);
  assert.equal(eval2.status, 'In Progress');
  assert.equal(eval2.quorumReached, false);

  // 3 distinct citizens
  const threeVerifications = [
    ...twoVerifications,
    { user_id: 'u3', status_voted: 'completed' }
  ];
  const eval3 = evaluateProjectQuorumAndDisputes(project, threeVerifications, 3);
  assert.equal(eval3.status, 'Citizen-confirmed');
  assert.equal(eval3.quorumReached, true);
});

test('Trust Engine - flags project as Disputed if contractor claims completed but citizens dispute', () => {
  const project = {
    id: 'p1',
    status: 'Completed',
    contractor_claimed_status: 'completed'
  };

  const disputingVerifications = [
    { user_id: 'u1', status_voted: 'not_completed' },
    { user_id: 'u2', status_voted: 'not_completed' }
  ];

  const evalResult = evaluateProjectQuorumAndDisputes(project, disputingVerifications);
  assert.equal(evalResult.isDisputed, true);
  assert.equal(evalResult.status, 'Disputed');
  assert.match(evalResult.reason, /Contractor claims 'Completed', but/);
});
