import seedData from './seedData.json';

const STORAGE_KEY = 'civictrack_browser_db_v3';

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading browser store:', e);
  }
  // Initialize from seedData
  const initial = JSON.parse(JSON.stringify(seedData));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Error saving browser store:', e);
  }
}

export const mockStore = {
  login: async (email, password) => {
    const store = getStore();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = store.users.find(
      u => u.email.toLowerCase() === cleanEmail && (u.password === password || password === 'demo1234')
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const token = 'mock_jwt_token_' + user.id;
    return { token, user };
  },

  register: async (userData) => {
    const store = getStore();
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists');
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: cleanEmail,
      password: userData.password,
      role: userData.role || 'citizen',
      profession: userData.profession || 'citizen',
      ward: userData.ward || 'Ward 4 (Anna Nagar)',
      phone: userData.phone || '+91 94440 00000',
      designation: userData.designation || 'Registered Citizen'
    };
    store.users.push(newUser);
    saveStore(store);
    const token = 'mock_jwt_token_' + newUser.id;
    return { token, user: newUser };
  },

  demoSwitch: async (role, email) => {
    const store = getStore();
    let targetUser;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      targetUser = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    } else if (role) {
      targetUser = store.users.find(u => u.role === role);
    }
    if (!targetUser) {
      targetUser = store.users.find(u => u.email === 'citizen@demo.com') || store.users[0];
    }
    const token = 'mock_jwt_token_' + targetUser.id;
    return { token, user: targetUser };
  },

  getDemoAccounts: async () => {
    const store = getStore();
    const accounts = store.users
      .filter(u => ['citizen@demo.com', 'sewage@demo.com', 'roads@demo.com', 'admin@demo.com', 'water@demo.com', 'admin@tn.gov.in', 'highways@tn.gov.in'].includes(u.email))
      .map(u => ({
        email: u.email,
        password: u.password || 'demo1234',
        name: u.name,
        role: u.role,
        department_name: u.department_name || null,
        designation: u.designation || 'Demo Account'
      }));
    return { accounts };
  },

  getMe: async () => {
    const store = getStore();
    const currentEmail = localStorage.getItem('civictrack_current_user_email');
    if (currentEmail) {
      const u = store.users.find(x => x.email.toLowerCase() === currentEmail.toLowerCase());
      if (u) return { user: u };
    }
    const defaultUser = store.users.find(u => u.email === 'citizen@demo.com') || store.users[0];
    return { user: defaultUser };
  },

  getProjects: async (params = {}) => {
    const store = getStore();
    let list = store.projects || [];
    if (params.department) {
      list = list.filter(p => p.department_name === params.department || p.department_id === params.department);
    }
    if (params.ward) {
      list = list.filter(p => p.ward === params.ward);
    }
    return { projects: list };
  },

  getProjectById: async (id) => {
    const store = getStore();
    const project = store.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return { project };
  },

  createProject: async (projectData) => {
    const store = getStore();
    const newProj = {
      id: `proj_${Date.now()}`,
      status: 'Proposed',
      amount_spent: 0,
      budget_variance: 0,
      variance_percentage: 0,
      delay_history: [],
      ...projectData
    };
    store.projects.unshift(newProj);
    saveStore(store);
    return { project: newProj };
  },

  updateProjectStatus: async (id, updateData) => {
    const store = getStore();
    const idx = store.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      store.projects[idx] = { ...store.projects[idx], ...updateData };
      saveStore(store);
      return { project: store.projects[idx] };
    }
    throw new Error('Project not found');
  },

  getProjectConflicts: async (id) => {
    const store = getStore();
    const p1 = store.projects.find(p => p.id === id);
    if (!p1) return { conflicts: [] };
    const conflicts = [];
    const lat1 = parseFloat(p1.latitude);
    const lon1 = parseFloat(p1.longitude);
    for (const p2 of store.projects) {
      if (p2.id === id) continue;
      const lat2 = parseFloat(p2.latitude);
      const lon2 = parseFloat(p2.longitude);
      const dist = Math.sqrt(Math.pow((lat1 - lat2) * 111000, 2) + Math.pow((lon1 - lon2) * 111000, 2));
      if (dist < 300) {
        conflicts.push({
          conflictingProject: p2,
          distanceMeters: Math.round(dist),
          recommendation: 'Coordinate trenching to prevent duplicate road-cutting.'
        });
      }
    }
    return { conflicts };
  },

  getReports: async (params = {}) => {
    const store = getStore();
    let list = store.reports || [];
    if (params.category) {
      list = list.filter(r => r.category === params.category);
    }
    if (params.ward) {
      list = list.filter(r => r.ward === params.ward);
    }
    return { reports: list };
  },

  getMyReports: async () => {
    const store = getStore();
    return { reports: store.reports || [] };
  },

  submitReport: async (reportData) => {
    const store = getStore();
    const newReport = {
      id: `rep_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'submitted',
      location_source: 'Interactive GPS Pin',
      location_verified: true,
      citizen_confirmed_resolved: false,
      ...reportData
    };
    store.reports.unshift(newReport);
    saveStore(store);
    return { report: newReport };
  },

  replyToReport: async (id, reply, status) => {
    const store = getStore();
    const idx = store.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      store.reports[idx] = {
        ...store.reports[idx],
        department_reply: reply,
        status: status || store.reports[idx].status
      };
      saveStore(store);
      return { report: store.reports[idx] };
    }
    throw new Error('Report not found');
  },

  confirmReportResolution: async (id) => {
    const store = getStore();
    const idx = store.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      store.reports[idx].citizen_confirmed_resolved = true;
      store.reports[idx].status = 'resolved';
      saveStore(store);
      return { report: store.reports[idx] };
    }
    throw new Error('Report not found');
  },

  submitVerification: async (verData) => {
    const store = getStore();
    const newVer = {
      id: `ver_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...verData
    };
    store.verifications = store.verifications || [];
    store.verifications.unshift(newVer);
    saveStore(store);
    return { verification: newVer };
  },

  getProjectVerifications: async (projectId) => {
    const store = getStore();
    const list = (store.verifications || []).filter(v => v.project_id === projectId);
    return { verifications: list };
  },

  getWorkOrders: async () => {
    const store = getStore();
    return { workOrders: store.workOrders || [] };
  },

  getProblemQueue: async () => {
    const store = getStore();
    return { queue: [] };
  },

  buildWorkOrder: async (payload) => {
    const store = getStore();
    const newWo = {
      workOrderId: `wo_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Proposed',
      ...payload
    };
    store.workOrders = store.workOrders || [];
    store.workOrders.unshift(newWo);
    saveStore(store);
    return { workOrder: newWo };
  },

  completePrimaryWorkOrder: async (id) => {
    const store = getStore();
    const idx = (store.workOrders || []).findIndex(wo => wo.workOrderId === id);
    if (idx !== -1) {
      store.workOrders[idx].status = 'Primary Completed';
      saveStore(store);
      return { workOrder: store.workOrders[idx] };
    }
    return { success: true };
  },

  logWorkOrderDelay: async (id, payload) => {
    return { success: true };
  },

  releaseSecondaryWorkOrder: async (id) => {
    return { success: true };
  },

  reassignWorkOrder: async (id, payload) => {
    return { success: true };
  },

  getAnalyticsOverview: async () => {
    const store = getStore();
    const projects = store.projects || [];
    const reports = store.reports || [];
    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.sanctioned_budget) || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (Number(p.amount_spent) || 0), 0);
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'In Progress').length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      totalGrievances: reports.length,
      resolvedGrievances: reports.filter(r => r.status === 'resolved').length,
      totalBudget,
      totalSpent,
      taxpayerSavings: 1400000
    };
  },

  getScorecards: async () => {
    const store = getStore();
    return {
      departments: (store.departments || []).map(d => ({
        ...d,
        completionRate: 88,
        grievanceResolutionTimeDays: 4.2,
        budgetComplianceScore: 92
      }))
    };
  },

  getHotspots: async () => {
    return {
      hotspots: [
        { ward: 'Ward 4 (Anna Nagar)', count: 6, primaryIssue: 'Road Excavation Overlap' },
        { ward: 'Ward 10 (T. Nagar)', count: 4, primaryIssue: 'Drainage & Utility Pipeline' }
      ]
    };
  },

  getEarlyWarnings: async () => {
    return {
      warnings: [
        {
          id: 'w1',
          severity: 'High',
          title: 'Monsoon Resurfacing Cut-off Window Approaching',
          affectedProjects: 3,
          message: 'All open trenching must conclude by October 25th per GCC protocol.'
        }
      ]
    };
  },

  getAdminConfig: async () => {
    const store = getStore();
    return { config: store.settings || {} };
  },

  updateAdminConfig: async (config) => {
    const store = getStore();
    store.settings = { ...(store.settings || {}), ...config };
    saveStore(store);
    return { config: store.settings };
  },

  getDisputes: async () => {
    return { disputes: [] };
  },

  resolveDispute: async (id, payload) => {
    return { success: true };
  },

  addDepartment: async (deptData) => {
    const store = getStore();
    const newDept = { id: `dept_${Date.now()}`, ...deptData };
    store.departments = store.departments || [];
    store.departments.push(newDept);
    saveStore(store);
    return { department: newDept };
  },

  addContractor: async (contData) => {
    const store = getStore();
    const newCont = { id: `cont_${Date.now()}`, ...contData };
    store.contractors = store.contractors || [];
    store.contractors.push(newCont);
    saveStore(store);
    return { contractor: newCont };
  },

  getAlerts: async () => {
    const store = getStore();
    return { alerts: store.alerts || [] };
  },

  createAlert: async (alertData) => {
    const store = getStore();
    const newAlert = { id: `alt_${Date.now()}`, created_at: new Date().toISOString(), ...alertData };
    store.alerts = store.alerts || [];
    store.alerts.unshift(newAlert);
    saveStore(store);
    return { alert: newAlert };
  },

  subscribeAlerts: async (payload) => {
    return { success: true, message: 'Subscribed to area excavation notifications.' };
  }
};
