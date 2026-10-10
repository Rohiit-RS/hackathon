import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AreaAlertsBanner from './components/AreaAlertsBanner';
import ReportModal from './components/ReportModal';

import CitizenDashboard from './pages/CitizenDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DigOncePlannerPage from './pages/DigOncePlannerPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MyReportsPage from './pages/MyReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [alerts, setAlerts] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await api.getAlerts();
        setAlerts(res.alerts || []);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      }
    }
    loadAlerts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Live Road Closure & Excavation Alerts Banner */}
      <AreaAlertsBanner alerts={alerts} />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        unreadAlertsCount={alerts.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'projects' && (
          <CitizenDashboard onOpenReportModal={() => setIsReportModalOpen(true)} />
        )}
        {activeTab === 'work-orders' && <DepartmentDashboard />}
        {activeTab === 'dig-once' && <DigOncePlannerPage />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'my-reports' && (
          <MyReportsPage onOpenReportModal={() => setIsReportModalOpen(true)} />
        )}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          // Switch to my-reports or refresh
          setActiveTab('my-reports');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-extrabold text-slate-800 text-sm">
              CivicTrack • Transparency & Coordination in Public Works
            </div>
            <p className="text-[11px] text-slate-400">
              Track: CivicTech | 24-Hour Web Development Hackathon, IIITDM Kancheepuram
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-mono">
              React + Node.js + Leaflet
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold">
              100% Seeded Demo Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
