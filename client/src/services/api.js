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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  demoSwitch: async (role, email) => {
    const res = await fetch(`${API_BASE}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to switch demo account');
    return data;
  },

  getDemoAccounts: async () => {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // PROJECTS
  getProjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/projects${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getProjectById: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  createProject: async (projectData) => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create project');
    return data;
  },

  updateProjectStatus: async (id, updateData) => {
    const res = await fetch(`${API_BASE}/projects/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update project status');
    return data;
  },

  getProjectConflicts: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}/conflicts`);
    return res.json();
  },

  // REPORTS
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getMyReports: async () => {
    const res = await fetch(`${API_BASE}/reports/my-reports`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  submitReport: async (formData) => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report');
    return data;
  },

  replyToReport: async (id, reply, status) => {
    const res = await fetch(`${API_BASE}/reports/${id}/reply`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply, status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reply to report');
    return data;
  },

  confirmReportResolution: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}/confirm-resolution`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to confirm resolution');
    return data;
  },

  // VERIFICATIONS (ANTI-GAMING PROGRESS CONFIRMATION)
  submitVerification: async (formData) => {
    const res = await fetch(`${API_BASE}/verifications`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit verification');
    return data;
  },

  getProjectVerifications: async (projectId) => {
    const res = await fetch(`${API_BASE}/verifications/project/${projectId}`);
    return res.json();
  },

  // WORK ORDERS & COORDINATION
  getWorkOrders: async () => {
    const res = await fetch(`${API_BASE}/work-orders`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  getProblemQueue: async () => {
    const res = await fetch(`${API_BASE}/work-orders/problem-queue`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  buildWorkOrder: async (payload) => {
    const res = await fetch(`${API_BASE}/work-orders/build`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to build work order');
    return data;
  },

  completePrimaryWorkOrder: async (workOrderId) => {
    const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/complete-primary`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete primary work order');
    return data;
  },

  logWorkOrderDelay: async (workOrderId, payload) => {
    const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/delay`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log delay');
    return data;
  },

  releaseSecondaryWorkOrder: async (workOrderId) => {
    const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/release-secondary`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to release secondary in parallel');
    return data;
  },

  reassignWorkOrder: async (workOrderId, payload) => {
    const res = await fetch(`${API_BASE}/work-orders/${workOrderId}/reassign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reassign work order');
    return data;
  },

  // ANALYTICS
  getAnalyticsOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return res.json();
  },

  getScorecards: async () => {
    const res = await fetch(`${API_BASE}/analytics/scorecards`);
    return res.json();
  },

  getHotspots: async () => {
    const res = await fetch(`${API_BASE}/analytics/hotspots`);
    return res.json();
  },

  getEarlyWarnings: async () => {
    const res = await fetch(`${API_BASE}/analytics/early-warnings`);
    return res.json();
  },

  // ADMIN
  getAdminConfig: async () => {
    const res = await fetch(`${API_BASE}/admin/config`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  updateAdminConfig: async (config) => {
    const res = await fetch(`${API_BASE}/admin/config`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update config');
    return data;
  },

  getDisputes: async () => {
    const res = await fetch(`${API_BASE}/admin/disputes`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  resolveDispute: async (projectId, payload) => {
    const res = await fetch(`${API_BASE}/admin/disputes/${projectId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve dispute');
    return data;
  },

  addDepartment: async (deptData) => {
    const res = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deptData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register department');
    return data;
  },

  addContractor: async (contData) => {
    const res = await fetch(`${API_BASE}/admin/contractors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to accredit contractor');
    return data;
  },

  // ALERTS
  getAlerts: async () => {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  createAlert: async (alertData) => {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(alertData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create alert');
    return data;
  },

  subscribeAlerts: async (payload) => {
    const res = await fetch(`${API_BASE}/alerts/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to subscribe to alerts');
    return data;
  }
};
