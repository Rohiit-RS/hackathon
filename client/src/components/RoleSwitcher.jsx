import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Wrench, Droplets, Check, ChevronDown, KeyRound, Building2 } from 'lucide-react';

export default function RoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const personas = [
    {
      role: 'citizen',
      email: 'citizen@demo.com',
      name: 'Priya Raman',
      title: 'Verified Resident (Ward 4)',
      badge: 'Citizen Access',
      department: 'Anna Nagar Residents Welfare Association',
      icon: User,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      role: 'sewage_officer',
      email: 'sewage@demo.com',
      name: 'Er. R. Senthil Nathan',
      title: 'Executive Engineer (Underground)',
      badge: 'Engineering Division',
      department: 'Sewage & Wastewater Management Board',
      icon: Droplets,
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    {
      role: 'roads_officer',
      email: 'roads@demo.com',
      name: 'Er. K. Balaji',
      title: 'Assistant Divisional Engineer',
      badge: 'Highway & Surface',
      department: 'Roads & Bridges Engineering Wing',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      role: 'admin',
      email: 'admin@demo.com',
      name: 'Dr. V. Rajesh, IAS',
      title: 'Municipal Commissioner & Chief Admin',
      badge: 'Executive Authority',
      department: 'Office of the Municipal Commissioner',
      icon: Shield,
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    }
  ];

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

  const current = personas.find(p => p.email === user?.email) || personas[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition"
        title="Switch authorized profile for evaluation"
      >
        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            {current.badge}
          </span>
          <span className="font-bold text-slate-900 truncate max-w-[140px]">
            {user?.name || current.name}
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
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Municipal System Access
                </span>
                <span className="text-[10px] text-slate-400">
                  Switch authorized persona for sandbox review
                </span>
              </div>
              <KeyRound className="w-4 h-4 text-civic-400" />
            </div>

            <div className="p-1.5 space-y-1">
              {personas.map((p) => {
                const PIcon = p.icon;
                const isSelected = user?.email === p.email;
                return (
                  <button
                    key={p.email}
                    onClick={() => handleSelect(p)}
                    className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-civic-50/80 border border-civic-200 text-civic-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg mt-0.5 ${p.color}`}>
                        <PIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{p.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {p.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 mt-0.5">{p.title}</div>
                        <div className="text-[10px] text-slate-400">{p.department}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-civic-600 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Secure Session: 256-bit TLS</span>
              <span className="font-mono text-emerald-600 font-bold">● System Online</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
