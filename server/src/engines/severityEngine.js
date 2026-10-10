/**
 * Severity Engine for CivicTrack
 * Classifies problem groups into Major, Moderate, or Minor based on transparent rules.
 */

const SEVERITY_RULES = {
  MAJOR_KEYWORDS: [
    'open sewage',
    'sewage overflow',
    'exposed wire',
    'live wire',
    'electrical shock',
    'cave-in',
    'road collapse',
    'pipeline burst',
    'gas leak',
    'contamination',
    'structural hazard',
    'deep crater'
  ],
  MODERATE_KEYWORDS: [
    'blocked drain',
    'pothole',
    'drainage overflow',
    'water leak',
    'water pipe leak',
    'street light broken',
    'cable dangling',
    'sidewalk damaged',
    'manhole cover loose'
  ],
  MAJOR_MIN_REPORTS: 10,
  MODERATE_MIN_REPORTS: 4,
  MAJOR_STALLED_DAYS: 14
};

/**
 * Classify a problem group into Minor, Moderate, or Major
 * @param {Object} problemGroup 
 * @returns {{ severity: string, reason: string, priorityScore: number }}
 */
function classifySeverity(problemGroup) {
  const count = problemGroup.reportCount || 1;
  const weightedCount = problemGroup.weightedReportCount || count;
  
  // Calculate stalled duration in days if applicable
  let daysSinceEarliest = 0;
  if (problemGroup.earliestReportDate) {
    const msDiff = Date.now() - new Date(problemGroup.earliestReportDate).getTime();
    daysSinceEarliest = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
  }

  // Combine text from reports to detect safety hazards
  const combinedText = [
    problemGroup.problemType || '',
    problemGroup.category || '',
    ...(problemGroup.reports || []).map(r => `${r.title || ''} ${r.description || ''}`)
  ].join(' ').toLowerCase();

  // 1. Check Major safety/health hazards
  const matchedMajorKeyword = SEVERITY_RULES.MAJOR_KEYWORDS.find(kw => combinedText.includes(kw));
  if (matchedMajorKeyword) {
    return {
      severity: 'Major',
      reason: `Safety or health risk detected (${matchedMajorKeyword})`,
      priorityScore: 100 + count
    };
  }

  // 2. Check work stalled for >= 14 days
  if (problemGroup.status !== 'resolved' && daysSinceEarliest >= SEVERITY_RULES.MAJOR_STALLED_DAYS) {
    return {
      severity: 'Major',
      reason: `Work unaddressed / stalled for ${daysSinceEarliest} days (exceeds ${SEVERITY_RULES.MAJOR_STALLED_DAYS} days threshold)`,
      priorityScore: 90 + count
    };
  }

  // 3. Check high report count (>= 10)
  if (count >= SEVERITY_RULES.MAJOR_MIN_REPORTS || weightedCount >= SEVERITY_RULES.MAJOR_MIN_REPORTS) {
    return {
      severity: 'Major',
      reason: `High complaint volume (${count} reports exceed 10+ threshold)`,
      priorityScore: 85 + count
    };
  }

  // 4. Check Moderate keywords
  const matchedModKeyword = SEVERITY_RULES.MODERATE_KEYWORDS.find(kw => combinedText.includes(kw));
  if (matchedModKeyword) {
    return {
      severity: 'Moderate',
      reason: `Disrupts daily civic use (${matchedModKeyword})`,
      priorityScore: 50 + count
    };
  }

  // 5. Check moderate report count (4-9)
  if (count >= SEVERITY_RULES.MODERATE_MIN_REPORTS) {
    return {
      severity: 'Moderate',
      reason: `Moderate complaint volume (${count} reports)`,
      priorityScore: 40 + count
    };
  }

  // 6. Minor: cosmetic or low impact (1-3 reports)
  return {
    severity: 'Minor',
    reason: `Low impact civic issue (${count} report${count > 1 ? 's' : ''})`,
    priorityScore: 10 + count
  };
}

/**
 * Sort a list of problem groups into a prioritized queue
 * Order: Severity (Major > Moderate > Minor), then report count (desc), then oldest first
 */
function sortPrioritizedQueue(problemGroups) {
  const severityRank = { Major: 3, Moderate: 2, Minor: 1 };

  return [...problemGroups].sort((a, b) => {
    const aRank = severityRank[a.severity] || 0;
    const bRank = severityRank[b.severity] || 0;

    if (bRank !== aRank) return bRank - aRank;

    // Report count descending
    if (b.reportCount !== a.reportCount) {
      return b.reportCount - a.reportCount;
    }

    // Oldest problem first (earliest timestamp)
    const aTime = new Date(a.earliestReportDate || 0).getTime();
    const bTime = new Date(b.earliestReportDate || 0).getTime();
    return aTime - bTime;
  });
}

module.exports = {
  classifySeverity,
  sortPrioritizedQueue,
  SEVERITY_RULES
};
