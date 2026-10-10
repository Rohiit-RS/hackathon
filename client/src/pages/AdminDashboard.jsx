import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Settings,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Send,
  Wrench,
  Award,
  PlusCircle,
  X,
  Phone,
  Mail,
  HardHat,
  Clock,
  Layers
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('disputes'); // 'disputes', 'departments', 'contractors', 'parameters'

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showContModal, setShowContModal] = useState(false);

  // Form states for settings
  const [handoffMinutes, setHandoffMinutes] = useState(60);
  const [verificationRadius, setVerificationRadius] = useState(200);
  const [quorumThreshold, setQuorumThreshold] = useState(3);
  const [maxPhotoSizeMB, setMaxPhotoSizeMB] = useState(5);
  const [maxReportsPerDay, setMaxReportsPerDay] = useState(10);
  const [maxVerificationsPerDay, setMaxVerificationsPerDay] = useState(10);

  // Grace periods
  const [majorGraceHours, setMajorGraceHours] = useState(24);
  const [moderateGraceHours, setModerateGraceHours] = useState(72);
  const [minorGraceDays, setMinorGraceDays] = useState(7);

  // Severity thresholds
  const [majorMinReports, setMajorMinReports] = useState(10);
  const [moderateMinReports, setModerateMinReports] = useState(4);
  const [majorStalledDays, setMajorStalledDays] = useState(14);

  // New Department Form
  const [deptForm, setDeptForm] = useState({
    name: '',
    category: 'roads',
    tier: 'Tier 1 (Surface)',
    contactEmail: '',
    leadOfficer: ''
  });
  const [savingDept, setSavingDept] = useState(false);

  // New Contractor Form
  const [contForm, setContForm] = useState({
    name: '',
    specialty: 'Civil Engineering & Bitumen',
    contactPhone: '',
    activeProjectsCount: 1
  });
  const [savingCont, setSavingCont] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [cfg, disp] = await Promise.all([
        api.getAdminConfig(),
        api.getDisputes()
      ]);

      setConfig(cfg);
      if (cfg.settings) {
        setHandoffMinutes(cfg.settings.handoffMinutes || 60);
        setVerificationRadius(cfg.settings.verificationRadiusMeters || 200);
        setQuorumThreshold(cfg.settings.quorumThreshold || 3);
        setMaxPhotoSizeMB(cfg.settings.maxPhotoSizeMB || 5);
        setMaxReportsPerDay(cfg.settings.maxReportsPerUserPerDay || 10);
        setMaxVerificationsPerDay(cfg.settings.maxVerificationsPerUserPerDay || 10);

        if (cfg.settings.gracePeriods) {
          setMajorGraceHours(cfg.settings.gracePeriods.Major?.level1GraceHours || 24);
          setModerateGraceHours(cfg.settings.gracePeriods.Moderate?.level1GraceHours || 72);
          setMinorGraceDays(Math.round((cfg.settings.gracePeriods.Minor?.level1GraceHours || 168) / 24));
        }

        if (cfg.settings.severityThresholds) {
          setMajorMinReports(cfg.settings.severityThresholds.majorMinReports || 10);
          setModerateMinReports(cfg.settings.severityThresholds.moderateMinReports || 4);
          setMajorStalledDays(cfg.settings.severityThresholds.majorStalledDays || 14);
        }
      }
      setDepartments(cfg.departments || []);
      setContractors(cfg.contractors || []);
      setDisputes(disp.disputes || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setFeedback(null);
      await api.updateAdminConfig({
        handoffMinutes: Number(handoffMinutes),
        verificationRadiusMeters: Number(verificationRadius),
        quorumThreshold: Number(quorumThreshold),
        maxPhotoSizeMB: Number(maxPhotoSizeMB),
        maxReportsPerUserPerDay: Number(maxReportsPerDay),
        maxVerificationsPerUserPerDay: Number(maxVerificationsPerDay),
        gracePeriods: {
          Major: { expectedHours: 48, level1GraceHours: Number(majorGraceHours), level2GraceHours: Number(majorGraceHours) },
          Moderate: { expectedHours: 120, level1GraceHours: Number(moderateGraceHours), level2GraceHours: Number(moderateGraceHours) },
          Minor: { expectedHours: 336, level1GraceHours: Number(minorGraceDays) * 24, level2GraceHours: Number(minorGraceDays) * 24 }
        },
        severityThresholds: {
          majorMinReports: Number(majorMinReports),
          moderateMinReports: Number(moderateMinReports),
          majorStalledDays: Number(majorStalledDays)
        }
      });
      setFeedback({ type: 'success', text: 'Municipal policies and engine parameters updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResolveDispute = async (projId, action, newContId) => {
    try {
      setFeedback(null);
      const res = await api.resolveDispute(projId, {
        resolutionAction: action,
        newContractorId: newContId,
        notes: `Admin executive order executed by ${user?.name || 'Commissioner Office'}`
      });
      setFeedback({ type: 'success', text: res.message });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name) return;
    try {
      setSavingDept(true);
      setFeedback(null);
      const res = await api.addDepartment(deptForm);
      setFeedback({ type: 'success', text: 'Municipal department accredited successfully!' });
      setShowDeptModal(false);
      setDeptForm({
        name: '',
        category: 'roads',
        tier: 'Tier 1 (Surface)',
        contactEmail: '',
        leadOfficer: ''
      });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingDept(false);
    }
  };

  const handleAddContractor = async (e) => {
    e.preventDefault();
    if (!contForm.name) return;
    try {
      setSavingCont(true);
      setFeedback(null);
      const res = await api.addContractor(contForm);
      setFeedback({ type: 'success', text: 'Public works contractor registered!' });
      setShowContModal(false);
      setContForm({
        name: '',
        specialty: 'Civil Engineering & Bitumen',
        contactPhone: '',
        activeProjectsCount: 1
      });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingCont(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full border border-blue-400/30">
            Municipal Executive Control Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Administration & Policy Calibration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage anti-abuse verification thresholds, escalation grace periods, inter-department handoffs, contractor accreditations, and executive resolution of disputed site claims.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ADMIN TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'disputes'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Disputes Queue ({disputes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'departments'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-civic-700" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contractors')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'contractors'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardHat className="w-4 h-4 text-amber-600" />
          <span>Contractors ({contractors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'parameters'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-700" />
          <span>Engine Calibration</span>
        </button>
      </div>

      {/* TAB 1: DISPUTES REVIEW QUEUE */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Disputed Verifications Review Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                Triggered automatically when contractors claim "Completed", but verified citizens on site report incomplete or hazardous conditions.
              </p>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-red-100 text-red-800">
              {disputes.length} Disputed Sites
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-3xl p-8 text-center space-y-2 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">No Open Verification Disputes</h3>
              <p className="text-emerald-700">All contractor progress reports match citizen on-site observations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((item) => (
                <div
                  key={item.project.id}
                  className="bg-white rounded-3xl border border-red-200 shadow-xs p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.project.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-mono">
                          DISPUTED
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.project.address} ({item.project.ward}) • Assigned: {item.project.contractor_name}
                      </div>
                    </div>

                    <span className="text-xs font-bold font-mono text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                      {item.disputeCount} Citizen Dissent Votes
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800">Dispute Background:</div>
                    <p className="text-slate-600 text-[11px]">
                      Contractor claimed completion on invoice, but {item.disputeCount} local verified citizens submitted geotagged photos showing unfinished excavation and unpaved trenches.
                    </p>
                  </div>

                  {/* Executive Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleResolveDispute(item.project.id, 'reopen_work')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition"
                    >
                      Reopen Work (Force Contractor Remediation)
                    </button>

                    <button
                      onClick={() => handleResolveDispute(item.project.id, 'reassign_contractor', 'cont_lnt')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl transition"
                    >
                      Reassign Contract to L&T Division
                    </button>

                    <button
                      onClick={() => handleResolveDispute(item.project.id, 'confirm_completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition"
                    >
                      Override & Confirm Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS MANAGEMENT */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-civic-700" />
                <span>Accredited Municipal Departments</span>
              </h2>
              <p className="text-xs text-slate-500">
                Departmental hierarchy, engineering tiering (Underground vs Surface), and contact registries.
              </p>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Department</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {dept.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {dept.tier || 'Municipal Agency'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{dept.name}</h3>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-civic-600 shrink-0" />
                    <span>Lead: <strong>{dept.leadOfficer || 'Chief Engineer'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dept.contactEmail || `${dept.id}@kancheepuram.gov.in`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONTRACTORS MANAGEMENT */}
      {activeTab === 'contractors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-600" />
                <span>Accredited Public Works Contractors</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track contractor ratings, active project loads, and certified technical specialties.
              </p>
            </div>
            <button
              onClick={() => setShowContModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Accredit Contractor</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map((cont) => (
              <div
                key={cont.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
                      Rating: {cont.rating || 4.5} ★
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {cont.activeProjectsCount || cont.active_projects || 1} Active Works
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{cont.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cont.specialty || 'General Civil Works'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{cont.contactPhone || '+91 44 2722 0000'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ENGINE CALIBRATION & PARAMETERS */}
      {activeTab === 'parameters' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-civic-700" />
              <span>Configurable Municipal Engine Rules & Thresholds</span>
            </h2>
            <p className="text-xs text-slate-500">
              Tune the underlying mathematical parameters for anti-gaming verification, rate limiting, and escalation SLA ladders.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Section A: Core Sequencing & Verification */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-civic-600" />
                <span>Core Sequencing & Geofencing</span>
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Primary-Secondary Handoff Gap
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={handoffMinutes}
                      onChange={(e) => setHandoffMinutes(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Minutes</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Default: 60 mins</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Verification GPS Radius
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={verificationRadius}
                      onChange={(e) => setVerificationRadius(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Meters</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Default: 200m max</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Citizen Quorum Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={quorumThreshold}
                      onChange={(e) => setQuorumThreshold(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Users</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Default: 3 distinct residents</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Max Photo Upload Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={maxPhotoSizeMB}
                      onChange={(e) => setMaxPhotoSizeMB(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">MB</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Default: 5 MB per image</p>
                </div>
              </div>
            </div>

            {/* Section B: Anti-Abuse Rate Limits */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Anti-Abuse 24-Hour Resident Rate Limits</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Max Reports Per User / 24 Hours
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={maxReportsPerDay}
                      onChange={(e) => setMaxReportsPerDay(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Reports</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Enforced by SHA256 photo hash & user token</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Max Verifications Per User / 24 Hours
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={maxVerificationsPerDay}
                      onChange={(e) => setMaxVerificationsPerDay(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Verifications</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Prevents coordinated review brigading</p>
                </div>
              </div>
            </div>

            {/* Section C: Escalation Grace Periods */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Escalation Grace Periods Before Reassignment</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-1">
                  <label className="block font-bold text-red-950">
                    Major Priority Grace
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={majorGraceHours}
                      onChange={(e) => setMajorGraceHours(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-red-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-600">Hours</span>
                  </div>
                  <p className="text-[10px] text-red-800">Level 2 reassignment triggers after 24 hrs</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1">
                  <label className="block font-bold text-amber-950">
                    Moderate Priority Grace
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={moderateGraceHours}
                      onChange={(e) => setModerateGraceHours(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-amber-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-600">Hours</span>
                  </div>
                  <p className="text-[10px] text-amber-800">Standard: 72 hours</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-1">
                  <label className="block font-bold text-blue-950">
                    Minor Priority Grace
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minorGraceDays}
                      onChange={(e) => setMinorGraceDays(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-blue-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-600">Days</span>
                  </div>
                  <p className="text-[10px] text-blue-800">Standard: 7 days</p>
                </div>
              </div>
            </div>

            {/* Section D: Severity Rules */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Severity Classification Thresholds</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Major Min Reports
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={majorMinReports}
                      onChange={(e) => setMajorMinReports(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Reports</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Promotes cluster to Major priority</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Moderate Min Reports
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={moderateMinReports}
                      onChange={(e) => setModerateMinReports(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Reports</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Promotes cluster to Moderate priority</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <label className="block font-bold text-slate-800">
                    Stalled Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={majorStalledDays}
                      onChange={(e) => setMajorStalledDays(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 bg-white"
                    />
                    <span className="font-semibold text-slate-500">Days</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Unworked for 14+ days becomes Major</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving Policy...' : 'Save All Policy Parameters'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REGISTER DEPARTMENT */}
      {showDeptModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-civic-700" />
                <h3 className="font-black text-slate-900 text-base">Accredit Municipal Department</h3>
              </div>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gas & Energy Distribution Agency"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sector Category *</label>
                <select
                  value={deptForm.category}
                  onChange={(e) => setDeptForm({ ...deptForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="roads">Roads (Surface)</option>
                  <option value="water">Water (Underground)</option>
                  <option value="sewage">Sewage (Underground)</option>
                  <option value="electricity">Electricity (Underground)</option>
                  <option value="telecom">Telecom & Optical Fiber (Underground)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dig-Once Sequencing Tier</label>
                <select
                  value={deptForm.tier}
                  onChange={(e) => setDeptForm({ ...deptForm, tier: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="Tier 2 (Underground)">Tier 2 (Underground - Precedes Surface)</option>
                  <option value="Tier 1 (Surface)">Tier 1 (Surface - Waits for Handoff)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Superintending / Lead Engineer</label>
                <input
                  type="text"
                  placeholder="e.g., Er. R. Swaminathan (SE)"
                  value={deptForm.leadOfficer}
                  onChange={(e) => setDeptForm({ ...deptForm, leadOfficer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  placeholder="contact@agency.kancheepuram.gov.in"
                  value={deptForm.contactEmail}
                  onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="bg-civic-700 hover:bg-civic-800 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{savingDept ? 'Registering...' : 'Accredit Agency'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCREDIT CONTRACTOR */}
      {showContModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Accredit Contractor Entity</h3>
              </div>
              <button
                onClick={() => setShowContModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContractor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contractor / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Nagarjuna Construction Company"
                  value={contForm.name}
                  onChange={(e) => setContForm({ ...contForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialty Domain</label>
                <input
                  type="text"
                  placeholder="e.g., Heavy Excavation & Trenchless Drilling"
                  value={contForm.specialty}
                  onChange={(e) => setContForm({ ...contForm, specialty: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Operations Phone</label>
                <input
                  type="text"
                  placeholder="+91 44 2722 9988"
                  value={contForm.contactPhone}
                  onChange={(e) => setContForm({ ...contForm, contactPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCont}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>{savingCont ? 'Registering...' : 'Register Contractor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
