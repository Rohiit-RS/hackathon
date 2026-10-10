const { getDistanceInMeters } = require('../utils/geo');

/**
 * Dig-Once Conflict Engine for CivicTrack
 * Detects spatial and temporal overlaps between public works projects
 * to prevent repeated street excavations and recommend joint trenching.
 */

const DEFAULT_CONFLICT_RADIUS_METERS = 150;
const DEFAULT_CONFLICT_WINDOW_MONTHS = 3;

/**
 * Detect dig-once conflicts for a target project against other planned/active/recent projects
 * @param {Object} targetProject The project being evaluated or created
 * @param {Array} existingProjects All existing projects
 * @param {number} radiusMeters Proximity threshold in meters
 * @param {number} windowMonths Temporal window in months
 * @returns {Array} List of detected conflicts with recommendations
 */
function detectDigOnceConflicts(
  targetProject,
  existingProjects = [],
  radiusMeters = DEFAULT_CONFLICT_RADIUS_METERS,
  windowMonths = DEFAULT_CONFLICT_WINDOW_MONTHS
) {
  if (!targetProject || !existingProjects) return [];

  const conflicts = [];
  const targetStart = new Date(targetProject.start_date || targetProject.created_at || Date.now()).getTime();
  const windowMs = windowMonths * 30 * 24 * 60 * 60 * 1000;

  for (const existing of existingProjects) {
    if (existing.id === targetProject.id) continue;

    // Check spatial proximity
    const dist = getDistanceInMeters(
      targetProject.latitude,
      targetProject.longitude,
      existing.latitude,
      existing.longitude
    );

    if (dist <= radiusMeters) {
      // Check temporal proximity
      const existingStart = new Date(existing.start_date || existing.created_at || Date.now()).getTime();
      const existingEnd = new Date(existing.end_date || existing.expected_end_date || existingStart + windowMs / 2).getTime();
      
      const timeDiff = Math.abs(targetStart - existingStart);
      const isOverlappingOrRecent = (
        timeDiff <= windowMs || 
        (targetStart >= existingStart && targetStart <= existingEnd + windowMs)
      );

      if (isOverlappingOrRecent) {
        conflicts.push({
          conflictId: `conflict_${targetProject.id}_${existing.id}`,
          targetProjectId: targetProject.id,
          conflictingProjectId: existing.id,
          conflictingProjectTitle: existing.title,
          conflictingDepartment: existing.department_name || existing.department,
          conflictingContractor: existing.contractor_name,
          distanceMeters: Math.round(dist),
          existingStatus: existing.status,
          existingStartDate: existing.start_date,
          existingEndDate: existing.end_date,
          recommendation: `Dig-Once Alert: ${existing.department_name || existing.department} has work planned/active ${Math.round(dist)}m away. Coordinate joint trenching or sequence prior to road restoration to prevent digging twice.`,
          severity: dist < 50 ? 'High Conflict' : 'Moderate Conflict'
        });
      }
    }
  }

  return conflicts;
}

module.exports = {
  detectDigOnceConflicts,
  DEFAULT_CONFLICT_RADIUS_METERS,
  DEFAULT_CONFLICT_WINDOW_MONTHS
};
