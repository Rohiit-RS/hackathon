const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { getDistanceInMeters } = require('../utils/geo');

// GET overall summary metrics
router.get('/overview', (req, res) => {
  const projects = db.projects.findAll();
  const reports = db.reports.findAll();
  const workOrders = db.workOrders.findAll();

  const totalSanctioned = projects.reduce((acc, p) => acc + (p.sanctioned_budget || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.amount_spent || 0), 0);
  const totalVariance = totalSpent - totalSanctioned;

  const delayedProjectsCount = projects.filter(p => p.status === 'Delayed' || p.is_overdue).length;
  const disputedProjectsCount = projects.filter(p => p.status === 'Disputed').length;
  const confirmedProjectsCount = projects.filter(p => p.status === 'Citizen-confirmed').length;

  res.json({
    metrics: {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'In Progress').length,
      delayedProjects: delayedProjectsCount,
      disputedProjects: disputedProjectsCount,
      citizenConfirmedProjects: confirmedProjectsCount,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status !== 'resolved').length,
      activeWorkOrders: workOrders.length,
      totalSanctionedBudget: totalSanctioned,
      totalAmountSpent: totalSpent,
      budgetVariance: totalVariance,
      variancePercentage: totalSanctioned > 0 ? Number(((totalVariance / totalSanctioned) * 100).toFixed(1)) : 0
    }
  });
});

// GET performance scorecards per department and contractor
router.get('/scorecards', (req, res) => {
  const departments = db.departments.findAll();
  const contractors = db.contractors.findAll();
  const projects = db.projects.findAll();
  const reports = db.reports.findAll();

  // Department Scorecards
  const departmentScorecards = departments.map(dept => {
    const deptProjects = projects.filter(p => p.department_id === dept.id || p.category === dept.category);
    const deptReports = reports.filter(r => r.category === dept.category);

    const totalSanctioned = deptProjects.reduce((acc, p) => acc + (p.sanctioned_budget || 0), 0);
    const totalSpent = deptProjects.reduce((acc, p) => acc + (p.amount_spent || 0), 0);
    const delayedCount = deptProjects.filter(p => p.status === 'Delayed' || p.is_overdue).length;
    const delayRate = deptProjects.length > 0 ? Number(((delayedCount / deptProjects.length) * 100).toFixed(1)) : 0;
    const budgetVariance = totalSpent - totalSanctioned;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      category: dept.category,
      tier: dept.tier,
      headName: dept.head_name,
      totalProjects: deptProjects.length,
      totalComplaints: deptReports.length,
      complaintsPerProject: deptProjects.length > 0 ? Number((deptReports.length / deptProjects.length).toFixed(1)) : deptReports.length,
      delayedProjects: delayedCount,
      delayRatePercentage: delayRate,
      sanctionedBudget: totalSanctioned,
      amountSpent: totalSpent,
      budgetVariance,
      averageResponseTimeHours: 18 // baseline simulated municipal response
    };
  });

  // Contractor Scorecards
  const contractorScorecards = contractors.map(cont => {
    const contProjects = projects.filter(p => p.contractor_id === cont.id);
    const delayedCount = contProjects.filter(p => p.status === 'Delayed' || p.is_overdue).length;
    const disputedCount = contProjects.filter(p => p.status === 'Disputed').length;

    const totalSanctioned = contProjects.reduce((acc, p) => acc + (p.sanctioned_budget || 0), 0);
    const totalSpent = contProjects.reduce((acc, p) => acc + (p.amount_spent || 0), 0);

    return {
      contractorId: cont.id,
      contractorName: cont.name,
      licenseNo: cont.license_no,
      rating: cont.rating,
      totalProjects: contProjects.length,
      delayedProjects: delayedCount,
      disputedProjects: disputedCount,
      delayRatePercentage: contProjects.length > 0 ? Number(((delayedCount / contProjects.length) * 100).toFixed(1)) : 0,
      sanctionedBudget: totalSanctioned,
      amountSpent: totalSpent,
      budgetVariance: totalSpent - totalSanctioned,
      complianceScore: Math.max(50, Math.round(cont.rating * 20 - delayedCount * 10 - disputedCount * 15))
    };
  });

  res.json({
    departments: departmentScorecards,
    contractors: contractorScorecards
  });
});

// GET complaint hotspots for heatmap
router.get('/hotspots', (req, res) => {
  const reports = db.reports.findAll();
  const hotspots = reports.map(r => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    intensity: r.status === 'in_progress' ? 0.9 : r.status === 'resolved' ? 0.3 : 0.7,
    category: r.category,
    title: r.title,
    ward: r.ward
  }));

  res.json({ hotspots });
});

// GET early warnings
router.get('/early-warnings', (req, res) => {
  const projects = db.projects.findAll();
  const reports = db.reports.findAll();
  const warnings = [];

  for (const project of projects) {
    // Count complaints near project site (within 100m)
    const nearbyReports = reports.filter(r => {
      const dist = getDistanceInMeters(project.latitude, project.longitude, r.latitude, r.longitude);
      return dist <= 100;
    });

    if (nearbyReports.length >= 2) {
      warnings.push({
        id: `warn_${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        department: project.department_name,
        type: 'Complaint Surge',
        complaintCount: nearbyReports.length,
        message: `High complaint density: ${nearbyReports.length} resident reports clustered within 100m of site.`,
        severity: nearbyReports.length >= 4 ? 'High' : 'Moderate',
        action: 'Mandatory on-site inspection recommended'
      });
    }

    if (project.budget_variance > 0) {
      warnings.push({
        id: `warn_budget_${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        department: project.department_name,
        type: 'Budget Overrun',
        message: `Project has exceeded sanctioned budget by ₹${project.budget_variance.toLocaleString()} (${project.variance_percentage}% variance).`,
        severity: project.variance_percentage > 10 ? 'High' : 'Moderate',
        action: 'Financial audit triggered'
      });
    }
  }

  res.json({ warnings });
});

module.exports = router;
