const test = require('node:test');
const assert = require('node:assert/strict');
const { clusterReports } = require('../src/engines/clusteringEngine');

test('Clustering Engine - merges reports within 50m radius into single cluster', () => {
  // Near Gandhi Road (distance ~ 25 meters apart)
  const sampleReports = [
    {
      id: 'r1',
      latitude: 12.834200,
      longitude: 79.703600,
      category: 'roads',
      problem_type: 'pothole',
      address: 'Gandhi Road Near Bus Stop',
      created_at: '2026-10-01T10:00:00Z',
      location_source: 'live_gps'
    },
    {
      id: 'r2',
      latitude: 12.834350,
      longitude: 79.703650, // ~17m away
      category: 'roads',
      problem_type: 'pothole',
      address: 'Gandhi Road Opposite Medical Shop',
      created_at: '2026-10-02T11:00:00Z',
      location_source: 'exif'
    },
    {
      id: 'r3',
      latitude: 12.834250,
      longitude: 79.703580, // ~8m away
      category: 'roads',
      problem_type: 'pothole',
      address: 'Gandhi Road Corner',
      created_at: '2026-10-03T12:00:00Z',
      location_source: 'manual_pin'
    }
  ];

  const clustered = clusterReports(sampleReports, 50);
  assert.equal(clustered.length, 1, 'Should produce exactly 1 aggregated problem group for 3 nearby potholes');
  assert.equal(clustered[0].reportCount, 3, 'Report count should be 3');
  // 1.0 + 1.0 + 0.5 (manual pin) = 2.5
  assert.equal(clustered[0].weightedReportCount, 2.5, 'Weighted report count should account for manual pin discount');
  assert.deepEqual(clustered[0].reportIds, ['r1', 'r2', 'r3']);
});

test('Clustering Engine - keeps different problem types separate at same location', () => {
  const mixedReports = [
    {
      id: 'r1',
      latitude: 12.834200,
      longitude: 79.703600,
      category: 'sewage',
      problem_type: 'sewage_leak',
      created_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'r2',
      latitude: 12.834220,
      longitude: 79.703610,
      category: 'roads',
      problem_type: 'pothole',
      created_at: '2026-10-02T10:00:00Z'
    }
  ];

  const clustered = clusterReports(mixedReports, 50);
  assert.equal(clustered.length, 2, 'Should create 2 distinct groups (sewage and road)');
  assert.equal(clustered[0].category, 'sewage');
  assert.equal(clustered[1].category, 'roads');
});
