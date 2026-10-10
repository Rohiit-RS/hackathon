const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// In-memory cache synced to JSON disk
let dbState = {
  users: [],
  departments: [],
  contractors: [],
  projects: [],
  reports: [],
  verifications: [],
  workOrders: [],
  alerts: [],
  settings: {
    handoffMinutes: 60,
    verificationRadiusMeters: 200,
    quorumThreshold: 3,
    maxPhotoSizeMB: 5
  }
};

/**
 * Load database from disk or initialize empty
 */
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(data);
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Failed to load db file, initializing default:', err.message);
  }
}

/**
 * Persist database to disk atomically
 */
function saveDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbState, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database:', err.message);
  }
}

// Ensure loaded initially
loadDb();

const db = {
  // Direct state accessor
  getState: () => dbState,
  setState: (newState) => {
    dbState = newState;
    saveDb();
  },

  // USERS
  users: {
    find: (predicate) => dbState.users.filter(predicate),
    findOne: (predicate) => dbState.users.find(predicate),
    findById: (id) => dbState.users.find(u => u.id === id),
    findByEmail: (email) => dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
    create: (userData) => {
      const user = { id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...userData };
      dbState.users.push(user);
      saveDb();
      return user;
    }
  },

  // DEPARTMENTS
  departments: {
    findAll: () => dbState.departments,
    findById: (id) => dbState.departments.find(d => d.id === id)
  },

  // CONTRACTORS
  contractors: {
    findAll: () => dbState.contractors,
    findById: (id) => dbState.contractors.find(c => c.id === id)
  },

  // PROJECTS
  projects: {
    findAll: () => dbState.projects,
    findById: (id) => dbState.projects.find(p => p.id === id),
    create: (projectData) => {
      const project = { id: `proj_${Date.now()}`, ...projectData };
      dbState.projects.push(project);
      saveDb();
      return project;
    },
    update: (id, updates) => {
      const idx = dbState.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        dbState.projects[idx] = { ...dbState.projects[idx], ...updates };
        saveDb();
        return dbState.projects[idx];
      }
      return null;
    }
  },

  // REPORTS
  reports: {
    findAll: () => dbState.reports,
    findById: (id) => dbState.reports.find(r => r.id === id),
    findByUserId: (userId) => dbState.reports.filter(r => r.user_id === userId),
    create: (reportData) => {
      const report = {
        id: `rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        status: 'submitted',
        ...reportData
      };
      dbState.reports.push(report);
      saveDb();
      return report;
    },
    update: (id, updates) => {
      const idx = dbState.reports.findIndex(r => r.id === id);
      if (idx !== -1) {
        dbState.reports[idx] = { ...dbState.reports[idx], ...updates };
        saveDb();
        return dbState.reports[idx];
      }
      return null;
    }
  },

  // VERIFICATIONS
  verifications: {
    findAll: () => dbState.verifications,
    findByProjectId: (projectId) => dbState.verifications.filter(v => v.project_id === projectId),
    findByUserId: (userId) => dbState.verifications.filter(v => v.user_id === userId),
    create: (verificationData) => {
      const verification = {
        id: `ver_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        ...verificationData
      };
      dbState.verifications.push(verification);
      saveDb();
      return verification;
    }
  },

  // WORK ORDERS
  workOrders: {
    findAll: () => dbState.workOrders,
    findById: (id) => dbState.workOrders.find(wo => wo.workOrderId === id),
    create: (woData) => {
      dbState.workOrders.push(woData);
      saveDb();
      return woData;
    },
    update: (id, updates) => {
      const idx = dbState.workOrders.findIndex(wo => wo.workOrderId === id);
      if (idx !== -1) {
        dbState.workOrders[idx] = { ...dbState.workOrders[idx], ...updates };
        saveDb();
        return dbState.workOrders[idx];
      }
      return null;
    }
  },

  // ALERTS
  alerts: {
    findAll: () => dbState.alerts,
    create: (alertData) => {
      const alert = {
        id: `alt_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...alertData
      };
      dbState.alerts.push(alert);
      saveDb();
      return alert;
    }
  },

  // SETTINGS
  settings: {
    get: () => dbState.settings,
    update: (updates) => {
      dbState.settings = { ...dbState.settings, ...updates };
      saveDb();
      return dbState.settings;
    }
  }
};

module.exports = db;
