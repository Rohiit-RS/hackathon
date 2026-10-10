const test = require('node:test');
const assert = require('node:assert/strict');
const { detectDigOnceConflicts } = require('../src/engines/digOnceEngine');

test('DigOnce Engine - detects nearby road excavation within 150m and 3 months', () => {
  const targetProject = {
    id: 'proj_new',
    title: 'Water Pipe Replacement',
    department: 'Water Department',
    latitude: 12.834200,
    longitude: 79.703600,
    start_date: '2026-10-15T00:00:00Z'
  };

  const existingProjects = [
    {
      id: 'proj_road_resurfacing',
      title: 'Gandhi Road Bitumen Resurfacing',
      department: 'Roads Department',
      latitude: 12.834300, // ~15m away
      longitude: 79.703650,
      start_date: '2026-10-25T00:00:00Z',
      end_date: '2026-11-15T00:00:00Z',
      status: 'Planned'
    },
    {
      id: 'proj_far_away',
      title: 'North Zone Bridge Maintenance',
      department: 'Roads Department',
      latitude: 12.900000, // ~8 km away
      longitude: 79.800000,
      start_date: '2026-10-20T00:00:00Z',
      status: 'Planned'
    }
  ];

  const conflicts = detectDigOnceConflicts(targetProject, existingProjects, 150, 3);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].conflictingProjectId, 'proj_road_resurfacing');
  assert.match(conflicts[0].recommendation, /Dig-Once Alert/);
});
