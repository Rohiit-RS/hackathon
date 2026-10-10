const { getDistanceInMeters } = require('../utils/geo');

/**
 * Trust & Anti-Abuse Engine for CivicTrack
 * Enforces location verification, anti-gaming quorum, dispute detection,
 * and role-based verification restrictions.
 */

const TRUST_CONFIG = {
  MAX_VERIFICATION_DISTANCE_METERS: 200,
  MAX_ALLOWED_GPS_ACCURACY_METERS: 50,
  QUORUM_THRESHOLD: 3,
  MAX_VERIFICATIONS_PER_USER_PER_DAY: 10
};

/**
 * Validate a citizen verification attempt against all anti-abuse rules
 * @param {Object} params
 * @returns {{ allowed: boolean, reason?: string, distanceMeters?: number }}
 */
function validateVerificationAttempt({
  user,
  project,
  existingUserVerifications = [],
  claimedStatus,
  liveLat,
  liveLng,
  gpsAccuracy = 10,
  photoUrl,
  config = TRUST_CONFIG
}) {
  // 1. Login required & citizen role check
  if (!user || !user.id) {
    return { allowed: false, reason: 'Authentication required to verify progress' };
  }

  // 2. No self-verification: Staff cannot verify own department or contractor's projects
  if (user.role === 'department_officer' && user.department_id === project.department_id) {
    return {
      allowed: false,
      reason: 'Anti-Abuse Rule: Department officers cannot verify projects belonging to their own department'
    };
  }
  if (user.contractor_id && user.contractor_id === project.contractor_id) {
    return {
      allowed: false,
      reason: 'Anti-Abuse Rule: Contractor personnel cannot self-verify their assigned contracts'
    };
  }

  // 3. One verification per user per project per status
  const alreadyVerifiedThisStatus = existingUserVerifications.some(
    v => v.user_id === user.id && v.project_id === project.id && v.status_voted === claimedStatus
  );
  if (alreadyVerifiedThisStatus) {
    return {
      allowed: false,
      reason: `You have already submitted a verification vote for '${claimedStatus}' on this project`
    };
  }

  // Rate limits: Maximum verifications per user per day
  const maxDaily = config.MAX_VERIFICATIONS_PER_USER_PER_DAY || 10;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const userRecentVerifications = existingUserVerifications.filter(
    v => v.user_id === user.id && (!v.created_at || new Date(v.created_at).getTime() > oneDayAgo)
  );
  if (userRecentVerifications.length >= maxDaily) {
    return {
      allowed: false,
      reason: `Anti-Abuse Rate Limit: You have reached the maximum allowed limit of ${maxDaily} verifications per day`
    };
  }

  // 4. Geotagged photo requirement
  if (!photoUrl) {
    return {
      allowed: false,
      reason: 'A current site photo is required for on-site verification'
    };
  }

  // 5. GPS Accuracy check
  if (gpsAccuracy > (config.MAX_ALLOWED_GPS_ACCURACY_METERS || 50)) {
    return {
      allowed: false,
      reason: `GPS signal accuracy too weak (${Math.round(gpsAccuracy)}m). Please move to an open area and retry (< 50m accuracy required).`
    };
  }

  // 6. Must be near the site (within 200 meters)
  if (typeof liveLat !== 'number' || typeof liveLng !== 'number') {
    return { allowed: false, reason: 'Live device GPS coordinates must be provided' };
  }

  const distMeters = getDistanceInMeters(liveLat, liveLng, project.latitude, project.longitude);
  if (distMeters > (config.MAX_VERIFICATION_DISTANCE_METERS || 200)) {
    return {
      allowed: false,
      distanceMeters: Math.round(distMeters),
      reason: `Location check failed: You are ${Math.round(distMeters)}m away from the project site. Verification is only permitted within ${config.MAX_VERIFICATION_DISTANCE_METERS}m of the actual site.`
    };
  }

  return {
    allowed: true,
    distanceMeters: Math.round(distMeters)
  };
}

/**
 * Assess project status and quorum updates given all submitted citizen verifications
 * @param {Object} project The project entity
 * @param {Array} verifications All verifications for this project
 * @param {number} quorumThreshold Minimum distinct users needed (default 3)
 * @returns {Object} Updated status determination
 */
function evaluateProjectQuorumAndDisputes(project, verifications = [], quorumThreshold = TRUST_CONFIG.QUORUM_THRESHOLD) {
  // Count distinct users for "in_progress", "completed", and "not_completed"
  const distinctInProgressUsers = new Set(
    verifications.filter(v => v.status_voted === 'in_progress').map(v => v.user_id)
  ).size;

  const distinctCompletedUsers = new Set(
    verifications.filter(v => v.status_voted === 'completed').map(v => v.user_id)
  ).size;

  const distinctDisputeUsers = new Set(
    verifications.filter(v => v.status_voted === 'not_completed' || v.status_voted === 'stalled').map(v => v.user_id)
  ).size;

  // Conflict / Dispute check:
  // If contractor claims "completed", but 2+ citizens report "not_completed"
  if (project.contractor_claimed_status === 'completed' && distinctDisputeUsers >= 2) {
    return {
      isDisputed: true,
      status: 'Disputed',
      displayBadge: 'Disputed',
      badgeColor: 'red',
      reason: `Contractor claims 'Completed', but ${distinctDisputeUsers} verified citizens report work is incomplete/stalled. Forwarded to Officer for physical inspection.`,
      inProgressVotes: distinctInProgressUsers,
      completedVotes: distinctCompletedUsers,
      disputeVotes: distinctDisputeUsers,
      quorumReached: false
    };
  }

  // Citizen confirmed check:
  if (distinctCompletedUsers >= quorumThreshold) {
    return {
      isDisputed: false,
      status: 'Citizen-confirmed',
      displayBadge: 'Citizen-confirmed',
      badgeColor: 'emerald',
      reason: `Status confirmed by ${distinctCompletedUsers} independent verified residents on site (quorum of ${quorumThreshold} reached).`,
      inProgressVotes: distinctInProgressUsers,
      completedVotes: distinctCompletedUsers,
      disputeVotes: distinctDisputeUsers,
      quorumReached: true
    };
  }

  return {
    isDisputed: false,
    status: project.status,
    displayBadge: project.status,
    badgeColor: 'blue',
    reason: `Pending quorum (${distinctCompletedUsers}/${quorumThreshold} required verifications for full confirmation).`,
    inProgressVotes: distinctInProgressUsers,
    completedVotes: distinctCompletedUsers,
    disputeVotes: distinctDisputeUsers,
    quorumReached: false
  };
}

module.exports = {
  TRUST_CONFIG,
  validateVerificationAttempt,
  evaluateProjectQuorumAndDisputes
};
