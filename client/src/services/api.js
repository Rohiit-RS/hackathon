import { mockStore } from './mockStore';

const API_BASE = '/api';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('civictrack_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const api = {
  // AUTH
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return await mockStore.login(email, password);
  },

  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return await mockStore.register(userData);
  },

  demoSwitch: async (role, email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return await mockStore.demoSwitch(role, email);
  },

  getDemoAccounts: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-accounts`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getDemoAccounts();
  },

  getMe: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getMe();
  },

  // PROJECTS
  getProjects: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/projects${query ? `?${query}` : ''}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getProjects(params);
  },

  getProjectById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getProjectById(id);
  },

  createProject: async (projectData) => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.createProject(projectData);
  },

  updateProjectStatus: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.updateProjectStatus(id, updateData);
  },

  getProjectConflicts: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/conflicts`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getProjectConflicts(id);
  },

  // REPORTS
  getReports: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/reports${query ? `?${query}` : ''}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getReports(params);
  },

  getMyReports: async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/my-reports`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getMyReports();
  },

  submitReport: async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    let obj = {};
    if (formData instanceof FormData) {
      for (const [k, v] of formData.entries()) {
        if (typeof v === 'string') obj[k] = v;
      }
    } else {
      obj = formData;
    }
    return await mockStore.submitReport(obj);
  },

  replyToReport: async (id, reply, status) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/reply`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reply, status })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.replyToReport(id, reply, status);
  },

  confirmReportResolution: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/confirm-resolution`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.confirmReportResolution(id);
  },

  // VERIFICATIONS
  submitVerification: async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/verifications`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    let obj = {};
    if (formData instanceof FormData) {
      for (const [k, v] of formData.entries()) {
        if (typeof v === 'string') obj[k] = v;
      }
    } else {
      obj = formData;
    }
    return await mockStore.submitVerification(obj);
  },

  getProjectVerifications: async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/verifications/project/${projectId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getProjectVerifications(projectId);
  },

  // WORK ORDERS & COORDINATION
  getWorkOrders: async () => {
    try {
      const res = await fetch(`${API_BASE}/work-orders`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getWorkOrders();
  },

  getProblemQueue: async () => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/problem-queue`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getProblemQueue();
  },

  buildWorkOrder: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/build`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.buildWorkOrder(payload);
  },

  completePrimaryWorkOrder: async (workOrderId) => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/complete-primary`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.completePrimaryWorkOrder(workOrderId);
  },

  logWorkOrderDelay: async (workOrderId, payload) => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/delay`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.logWorkOrderDelay(workOrderId, payload);
  },

  releaseSecondaryWorkOrder: async (workOrderId) => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/release-secondary`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.releaseSecondaryWorkOrder(workOrderId);
  },

  reassignWorkOrder: async (workOrderId, payload) => {
    try {
      const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/reassign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.reassignWorkOrder(workOrderId, payload);
  },

  // ANALYTICS
  getAnalyticsOverview: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getAnalyticsOverview();
  },

  getScorecards: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/scorecards`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getScorecards();
  },

  getHotspots: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/hotspots`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getHotspots();
  },

  getEarlyWarnings: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/early-warnings`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getEarlyWarnings();
  },

  // ADMIN
  getAdminConfig: async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/config`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getAdminConfig();
  },

  updateAdminConfig: async (config) => {
    try {
      const res = await fetch(`${API_BASE}/admin/config`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.updateAdminConfig(config);
  },

  getDisputes: async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/disputes`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getDisputes();
  },

  resolveDispute: async (projectId, payload) => {
    try {
      const res = await fetch(`${API_BASE}/admin/disputes/${projectId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.resolveDispute(projectId, payload);
  },

  addDepartment: async (deptData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(deptData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.addDepartment(deptData);
  },

  addContractor: async (contData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/contractors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.addContractor(contData);
  },

  // ALERTS
  getAlerts: async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.getAlerts();
  },

  createAlert: async (alertData) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(alertData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.createAlert(alertData);
  },

  subscribeAlerts: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/subscribe`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return await mockStore.subscribeAlerts(payload);
  }
};
