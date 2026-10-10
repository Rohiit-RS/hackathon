const test = require('node:test');
const assert = require('node:assert/strict');
const { classifySeverity, sortPrioritizedQueue } = require('../src/engines/severityEngine');

test('Severity Engine - classifies safety hazards as Major', () => {
  const hazardGroup = {
    category: 'electricity',
    problemType: 'exposed wire',
    reportCount: 1,
    reports: [{ title: 'Live wire fallen across pedestrian lane', description: 'danger of electrical shock' }]
  };

  const result = classifySeverity(hazardGroup);
  assert.equal(result.severity, 'Major');
  assert.match(result.reason, /Safety or health risk/);
});

test('Severity Engine - classifies 10+ reports as Major regardless of keyword', () => {
  const highVolumeGroup = {
    category: 'roads',
    problemType: 'curb repaint',
    reportCount: 12,
    reports: []
  };

  const result = classifySeverity(highVolumeGroup);
  assert.equal(result.severity, 'Major');
  assert.match(result.reason, /High complaint volume/);
});

test('Severity Engine - classifies stalled issue (>14 days) as Major', () => {
  const stalledGroup = {
    category: 'drainage',
    problemType: 'silt cleanup',
    reportCount: 2,
    status: 'pending',
    earliestReportDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    reports: []
  };

  const result = classifySeverity(stalledGroup);
  assert.equal(result.severity, 'Major');
  assert.match(result.reason, /stalled for/);
});

test('Severity Engine - classifies 4-9 reports or moderate keywords as Moderate', () => {
  const modGroup = {
    category: 'roads',
    problemType: 'pothole',
    reportCount: 3,
    reports: [{ title: 'Pothole on bus route' }]
  };

  const result = classifySeverity(modGroup);
  assert.equal(result.severity, 'Moderate');
});

test('Severity Engine - sorts prioritized queue by Severity, Count, and Age', () => {
  const items = [
    { id: '1', severity: 'Minor', reportCount: 2, earliestReportDate: '2026-10-01' },
    { id: '2', severity: 'Major', reportCount: 5, earliestReportDate: '2026-10-05' },
    { id: '3', severity: 'Major', reportCount: 15, earliestReportDate: '2026-10-02' },
    { id: '4', severity: 'Moderate', reportCount: 6, earliestReportDate: '2026-10-03' }
  ];

  const sorted = sortPrioritizedQueue(items);
  assert.equal(sorted[0].id, '3', 'Top item should be Major with 15 reports');
  assert.equal(sorted[1].id, '2', 'Second should be Major with 5 reports');
  assert.equal(sorted[2].id, '4', 'Third should be Moderate');
  assert.equal(sorted[3].id, '1', 'Last should be Minor');
});
