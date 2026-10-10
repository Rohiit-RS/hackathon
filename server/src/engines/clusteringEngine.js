const { getDistanceInMeters } = require('../utils/geo');

/**
 * Clustering Engine for CivicTrack
 * Groups citizen reports within 50 meters into location clusters,
 * then sub-groups by problem type (e.g. pothole, sewage leak).
 */

const DEFAULT_RADIUS_METERS = 50;

/**
 * Cluster raw reports into location-and-type aggregated problem groups
 * @param {Array} reports Array of citizen reports
 * @param {number} radiusMeters Radius threshold (default 50m)
 * @returns {Array} List of clustered problem groups
 */
function clusterReports(reports, radiusMeters = DEFAULT_RADIUS_METERS) {
  if (!reports || reports.length === 0) return [];

  // Step 1: Spatial clustering using Union-Find / greedy centroid assignment
  const clusters = [];

  for (const report of reports) {
    let assignedCluster = null;

    for (const cluster of clusters) {
      const dist = getDistanceInMeters(
        report.latitude,
        report.longitude,
        cluster.centroidLat,
        cluster.centroidLng
      );

      if (dist <= radiusMeters) {
        assignedCluster = cluster;
        break;
      }
    }

    if (assignedCluster) {
      assignedCluster.reports.push(report);
      // Recompute running centroid
      const total = assignedCluster.reports.length;
      assignedCluster.centroidLat =
        assignedCluster.reports.reduce((acc, r) => acc + r.latitude, 0) / total;
      assignedCluster.centroidLng =
        assignedCluster.reports.reduce((acc, r) => acc + r.longitude, 0) / total;
    } else {
      clusters.push({
        clusterId: `cluster_${clusters.length + 1}`,
        centroidLat: report.latitude,
        centroidLng: report.longitude,
        address: report.address || 'Reported Location',
        ward: report.ward || 'Ward 1',
        reports: [report]
      });
    }
  }

  // Step 2: Sub-group by problem type within each location cluster
  const aggregatedProblemGroups = [];

  for (const cluster of clusters) {
    const typeBuckets = {};

    for (const report of cluster.reports) {
      const category = (report.category || 'general').toLowerCase();
      const problemType = (report.problem_type || report.category || 'issue').toLowerCase();
      const key = `${category}__${problemType}`;

      if (!typeBuckets[key]) {
        typeBuckets[key] = {
          category: report.category,
          problemType: report.problem_type || report.category,
          reports: []
        };
      }
      typeBuckets[key].reports.push(report);
    }

    for (const [key, bucket] of Object.entries(typeBuckets)) {
      const totalCount = bucket.reports.length;
      // Calculate weighted count: manual pin = 0.5 weight until corroborated by high-trust report or officer review
      const isCorroborated = bucket.reports.some(
        r => (r.location_source !== 'manual_pin' && r.location_verified) || r.department_reply
      );
      const weightedCount = bucket.reports.reduce((acc, r) => {
        const weight = (r.location_source === 'manual_pin' && !isCorroborated) ? 0.5 : 1.0;
        return acc + weight;
      }, 0);

      // Latest and earliest dates
      const timestamps = bucket.reports.map(r => new Date(r.created_at).getTime()).sort();
      const earliestReportDate = new Date(timestamps[0]).toISOString();
      const latestReportDate = new Date(timestamps[timestamps.length - 1]).toISOString();

      // Collect sample photos
      const photos = bucket.reports
        .flatMap(r => r.photos || (r.photo_url ? [r.photo_url] : []))
        .filter(Boolean);

      aggregatedProblemGroups.push({
        groupId: `${cluster.clusterId}_${key}`,
        clusterId: cluster.clusterId,
        latitude: cluster.centroidLat,
        longitude: cluster.centroidLng,
        address: cluster.address,
        ward: cluster.ward,
        category: bucket.category,
        problemType: bucket.problemType,
        reportCount: totalCount,
        weightedReportCount: Number(weightedCount.toFixed(1)),
        reportIds: bucket.reports.map(r => r.id),
        reports: bucket.reports,
        earliestReportDate,
        latestReportDate,
        photos: photos.slice(0, 5),
        status: bucket.reports.some(r => r.status === 'in_progress')
          ? 'in_progress'
          : bucket.reports.every(r => r.status === 'resolved')
          ? 'resolved'
          : 'pending'
      });
    }
  }

  return aggregatedProblemGroups;
}

module.exports = {
  clusterReports,
  DEFAULT_RADIUS_METERS
};
