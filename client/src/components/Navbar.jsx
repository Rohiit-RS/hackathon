import React from 'react';
import { useAuth } from '../context/AuthContext';
import RoleSwitcher from './RoleSwitcher';
import {
  MapPin,
  ClipboardList,
  GitMerge,
  BarChart3,
  FileText,
  ShieldCheck,
  PlusCircle,
  Building2,
  Phone,
  HelpCircle,
  Globe
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenReportModal, unreadAlertsCount = 2 }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'projects', label: 'Public Works Registry', icon: MapPin },
    { id: 'work-orders', label: 'Joint Coordination Board', icon: ClipboardList, badge: 'Dig-Once Protocol' },
    { id: 'dig-once', label: 'Excavation Conflict Engine', icon: GitMerge },
    { id: 'analytics', label: 'Audits & Scorecards', icon: BarChart3 },
    { id: 'my-reports', label: 'My Grievances', icon: FileText },
    { id: 'admin', label: 'Executive Administration', icon: ShieldCheck, adminOnly: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Official Government Top Bar */}
      <div className="bg-[#0b2545] text-slate-200 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-civic-300" />
              Government of Tamil Nadu • Municipal Administration & Water Supply Department
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-300 font-mono">GKMC Portal ID: TN-KPM-2026</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-300">
            <span className="flex items-center gap-1 text-slate-200">
              <Phone className="w-3 h-3 text-emerald-400" />
              Toll-Free Helpline: <strong className="font-mono text-white">1913</strong>
            </span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline text-slate-300">RTI Act Compliant</span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline text-slate-300">ISO 9001:2015 Certified Registry</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Seal */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('projects')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0b2545] via-[#134074] to-[#0284c7] flex items-center justify-center text-white shadow-md shadow-civic-900/15 group-hover:scale-102 transition border border-white/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-[#0b2545]">
                    CivicTrack
                  </span>
                  <span className="text-[10px] font-bold text-civic-800 bg-civic-50 border border-civic-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Official Portal
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                  Integrated Public Works & Utilities Coordination Platform
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'department_officer') {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-slate-100 text-[#0b2545] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-civic-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Persona Switcher */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 bg-[#0b2545] hover:bg-[#134074] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-civic-300" />
              <span>Report Grievance</span>
            </button>

            {/* Persona Switcher */}
            <RoleSwitcher />
          </div>
        </div>

        {/* Sub-nav for responsive layouts */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'department_officer') {
              return null;
            }
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-100 text-[#0b2545] font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
