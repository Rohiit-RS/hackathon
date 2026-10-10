import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  HardHat,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    profession: 'citizen', // 'citizen', 'officer', 'contractor', 'admin'
    department_name: 'Roads & Highways Department',
    department_id: 'dept_roads',
    contractor_name: 'L&T Infrastructure',
    ward: 'Ward 4 (Anna Nagar)',
    phone: '',
    designation: ''
  });

  const demoAccounts = [
    {
      role: 'citizen',
      name: 'Priya Raman',
      email: 'citizen@demo.com',
      password: 'demo1234',
      label: 'Citizen / Resident',
      badge: 'Public Grievance',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    {
      role: 'water_officer',
      name: 'Er. M. Deepa',
      email: 'water@demo.com',
      password: 'demo1234',
      label: 'Water Works Dept',
      badge: 'Tier 1 Underground',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    },
    {
      role: 'sewage_officer',
      name: 'Er. R. Senthil Nathan',
      email: 'sewage@demo.com',
      password: 'demo1234',
      label: 'Sewage Department',
      badge: 'Executive Engineer',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      role: 'roads_officer',
      name: 'Er. K. Balaji',
      email: 'roads@demo.com',
      password: 'demo1234',
      label: 'Roads & Highways',
      badge: 'Divisional Engineer',
      color: 'bg-amber-50 border-amber-200 text-amber-800'
    },
    {
      role: 'admin',
      name: 'Dr. V. Rajesh, IAS',
      email: 'admin@demo.com',
      password: 'demo1234',
      label: 'Chief Administrator',
      badge: 'Municipal Commissioner',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  ];

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Email and password are required');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(loginEmail.trim(), loginPassword);
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoClick = async (demo) => {
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(demo.email, demo.password);
      setSuccessMsg(`Signed in as ${demo.name} (${demo.label})!`);
      setTimeout(() => {
        if (onClose) onClose();
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Demo authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setErrorMsg('Name, email, and password are required');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);

      let role = 'citizen';
      if (registerForm.profession === 'officer') role = 'department_officer';
      else if (registerForm.profession === 'contractor') role = 'contractor';
      else if (registerForm.profession === 'admin') role = 'admin';

      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        role,
        profession: registerForm.profession,
        department_name: registerForm.profession === 'officer' ? registerForm.department_name : null,
        department_id: registerForm.profession === 'officer' ? registerForm.department_id : null,
        contractor_name: registerForm.profession === 'contractor' ? registerForm.contractor_name : null,
        ward: registerForm.ward,
        phone: registerForm.phone,
        designation: registerForm.designation || (role === 'citizen' ? 'Verified Resident' : 'Public Official')
      };

      await register(payload);
      setSuccessMsg('Account registered and profile created successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-[#0b2545] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-base leading-tight">CivicTrack Authentication</h3>
              <div className="text-[10px] text-slate-300">
                Official Municipal Access & Role Registry
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'login'
                ? 'border-civic-700 text-civic-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In with Email / Demo
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'register'
                ? 'border-civic-700 text-civic-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account & Choose Role
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="citizen@demo.com or your registered email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password (demo password: demo1234)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0b2545] hover:bg-[#134074] text-white font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>
              </form>

              {/* DEMO ACCOUNTS QUICK-FILL SECTION */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">
                    One-Click Demo Credentials (Password: demo1234)
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Instant Test Login
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleQuickDemoClick(demo)}
                      className={`p-2.5 rounded-xl border text-left transition hover:scale-101 hover:shadow-xs flex flex-col justify-between ${demo.color}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-extrabold text-xs">{demo.label}</span>
                          <span className="text-[9px] font-mono font-bold bg-white/80 px-1.5 py-0.2 rounded">
                            {demo.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold">{demo.name}</div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-black/10 flex items-center justify-between text-[10px] font-mono opacity-80">
                        <span>{demo.email}</span>
                        <span className="underline">demo1234</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER / CREATE ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. Meenakshi"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@kancheepuram.gov.in"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Create secure password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* PROFESSION & DEPARTMENT CHOOSER */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                <label className="block font-bold text-slate-800">
                  Select Profession / Department Role *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'citizen', label: 'Resident / Citizen', icon: User, desc: 'Public Works Auditor' },
                    { id: 'officer', label: 'Department Engineer', icon: Building, desc: 'Govt Field Officer' },
                    { id: 'contractor', label: 'Works Contractor', icon: HardHat, desc: 'Site Construction' },
                    { id: 'admin', label: 'Administrator', icon: Shield, desc: 'Executive Authority' }
                  ].map((roleOption) => {
                    const RIcon = roleOption.icon;
                    const isSelected = registerForm.profession === roleOption.id;
                    return (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => setRegisterForm({ ...registerForm, profession: roleOption.id })}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-civic-700 text-white border-civic-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <RIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-civic-600'}`} />
                        <div>
                          <div className="font-bold text-xs leading-snug">{roleOption.label}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                            {roleOption.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-fields for Department Officer */}
                {registerForm.profession === 'officer' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Select Department Agency *
                      </label>
                      <select
                        value={registerForm.department_name}
                        onChange={(e) => {
                          const deptName = e.target.value;
                          let deptId = 'dept_roads';
                          if (deptName.includes('Sewage')) deptId = 'dept_sewage';
                          else if (deptName.includes('Water')) deptId = 'dept_water';
                          else if (deptName.includes('Electricity')) deptId = 'dept_power';
                          else if (deptName.includes('Telecom')) deptId = 'dept_telecom';
                          setRegisterForm({
                            ...registerForm,
                            department_name: deptName,
                            department_id: deptId
                          });
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="Roads & Highways Department">Roads & Highways Department (Surface)</option>
                        <option value="Sewage Department">Sewage & Sanitation Board (Underground)</option>
                        <option value="Water Works Department">Water Works Department (Underground)</option>
                        <option value="Storm Drainage Department">Storm Drainage Department (Mid-tier)</option>
                        <option value="Electricity Board">Electricity Board (Conduit)</option>
                        <option value="Telecom & Fiber Authority">Telecom & Fiber Authority (Conduit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Engineering Designation / Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Assistant Executive Engineer (AEE)"
                        value={registerForm.designation}
                        onChange={(e) => setRegisterForm({ ...registerForm, designation: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-fields for Contractor */}
                {registerForm.profession === 'contractor' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Contracting Firm / Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. L&T Infrastructure or Nagarjuna Construction"
                        value={registerForm.contractor_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, contractor_name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ward & Phone */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Ward / Zone</label>
                  <select
                    value={registerForm.ward}
                    onChange={(e) => setRegisterForm({ ...registerForm, ward: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Ward 1 (Central Commercial)">Ward 1 (Central Commercial)</option>
                    <option value="Ward 2 (Gandhi Nagar)">Ward 2 (Gandhi Nagar)</option>
                    <option value="Ward 3 (Ennaikaran Market)">Ward 3 (Ennaikaran Market)</option>
                    <option value="Ward 4 (Anna Nagar)">Ward 4 (Anna Nagar)</option>
                    <option value="Ward 5 (Pillaiyarpalayam)">Ward 5 (Pillaiyarpalayam)</option>
                    <option value="Ward 6 (Orikkai Corridor)">Ward 6 (Orikkai Corridor)</option>
                    <option value="Chennai Metro Region">Chennai Metro Region (State-Wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number (SMS OTP Alerts)</label>
                  <input
                    type="text"
                    placeholder="+91 98401 00000"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b2545] hover:bg-[#134074] text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Creating Profile...' : 'Complete Registration & Sign In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
