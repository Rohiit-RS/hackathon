import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Wrench,
  Droplets,
  Check,
  ChevronDown,
  KeyRound,
  Building2,
  LogOut,
  UserPlus,
  LogIn
} from 'lucide-react';

export default function RoleSwitcher() {
  const { user, switchDemoRole, logout, openAuthModal, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const personas = [
    {
      role: 'citizen',
      email: 'citizen@demo.com',
      password: 'demo1234',
      name: 'Priya Raman',
      title: 'Verified Resident (Ward 4)',
      badge: 'Citizen Access',
      department: 'Anna Nagar Residents Welfare Association',
      icon: User,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      role: 'water_officer',
      email: 'water@demo.com',
      password: 'demo1234',
      name: 'Er. M. Deepa',
      title: 'Executive Engineer (Underground)',
      badge: 'Water Works',
      department: 'Water Works Department (GKMC)',
      icon: Droplets,
      color: 'bg-cyan-50 text-cyan-800 border-cyan-200'
    },
    {
      role: 'sewage_officer',
      email: 'sewage@demo.com',
      password: 'demo1234',
      name: 'Er. R. Senthil Nathan',
      title: 'Executive Engineer (Underground)',
      badge: 'Sewage Board',
      department: 'Sewage & Wastewater Management Board',
      icon: Droplets,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    {
      role: 'roads_officer',
      email: 'roads@demo.com',
      password: 'demo1234',
      name: 'Er. K. Balaji',
      title: 'Assistant Divisional Engineer',
      badge: 'Roads & Surface',
      department: 'Roads & Bridges Engineering Wing',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      role: 'admin',
      email: 'admin@demo.com',
      password: 'demo1234',
      name: 'Dr. V. Rajesh, IAS',
      title: 'Municipal Commissioner & Chief Admin',
      badge: 'Executive Authority',
      department: 'Office of the Municipal Commissioner',
      icon: Shield,
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    }
  ];

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openAuthModal('login')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition"
        >
          <LogIn className="w-3.5 h-3.5 text-civic-700" />
          <span>Sign In</span>
        </button>
        <button
          onClick={() => openAuthModal('register')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-civic-700 hover:bg-civic-800 transition shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5 text-amber-300" />
          <span>Register</span>
        </button>
      </div>
    );
  }

  const handleSelect = async (target) => {
    try {
      setSwitching(true);
      await switchDemoRole(target.email);
      setIsOpen(false);
    } catch (err) {
      alert('Unable to authenticate: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const matchedDemo = personas.find(p => p.email === user?.email);
  const displayBadge = matchedDemo
    ? matchedDemo.badge
    : user.role === 'admin'
    ? 'Administrator'
    : user.role === 'department_officer'
    ? (user.department_name || 'Officer')
    : user.role === 'contractor'
    ? (user.contractor_name || 'Contractor')
    : 'Resident';

  const DisplayIcon = matchedDemo
    ? matchedDemo.icon
    : user.role === 'admin'
    ? Shield
    : user.role === 'department_officer'
    ? Building2
    : user.role === 'contractor'
    ? Wrench
    : User;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition"
        title="Account Profile & Role Switcher"
      >
        <div className="w-6 h-6 rounded-full bg-civic-100 text-civic-800 flex items-center justify-center font-bold text-xs">
          <DisplayIcon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate max-w-[120px]">
            {displayBadge}
          </span>
          <span className="font-bold text-slate-900 truncate max-w-[130px] block">
            {user.name}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
            {/* Header with Active User Info */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-[#0b2545] text-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Active Session Profile
                </span>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <div className="mt-1 font-bold text-sm text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-300 font-mono truncate">{user.email}</div>
              {user.department_name && (
                <div className="text-[10px] text-civic-200 mt-0.5">{user.department_name}</div>
              )}
            </div>

            {/* DEMO PERSONAS QUICK SWITCH */}
            <div className="p-2 border-b border-slate-100">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Switch to Demo Persona</span>
                <span className="text-slate-400 font-mono">pwd: demo1234</span>
              </div>
              <div className="space-y-1 mt-1 max-h-56 overflow-y-auto">
                {personas.map((p) => {
                  const PIcon = p.icon;
                  const isSelected = user?.email === p.email;
                  return (
                    <button
                      key={p.email}
                      onClick={() => handleSelect(p)}
                      className={`w-full flex items-start justify-between p-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-civic-50/90 border border-civic-200 text-civic-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-lg mt-0.5 ${p.color}`}>
                          <PIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {p.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.email}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-civic-600 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Links: Log In / Register / Sign Out */}
            <div className="p-2 bg-slate-50 space-y-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setIsOpen(false);
                  openAuthModal('login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-white hover:shadow-2xs transition"
              >
                <LogIn className="w-4 h-4 text-civic-600" />
                <span>Sign In with Another Account</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  openAuthModal('register');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-white hover:shadow-2xs transition"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Create New Account / Register Role</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
