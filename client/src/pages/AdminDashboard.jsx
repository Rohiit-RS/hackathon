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
  Award
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form states for settings
  const [handoffMinutes, setHandoffMinutes] = useState(60);
  const [verificationRadius, setVerificationRadius] = useState(200);
  const [quorumThreshold, setQuorumThreshold] = useState(3);
  const [maxPhotoSizeMB, setMaxPhotoSizeMB] = useState(5);

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
      }
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
        handoffMinutes,
        verificationRadiusMeters: verificationRadius,
        quorumThreshold,
        maxPhotoSizeMB
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full border border-blue-400/30">
            Municipal Executive Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Administration & Policy Calibration Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage anti-abuse verification thresholds, inter-department handoff buffers, contractor contract reassignments, and executive resolution of disputed site claims.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* DISPUTED CLAIMS QUEUE */}
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

      {/* SYSTEM CONFIGURATION & PARAMETERS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-civic-700" />
            <span>Configurable Municipal Engine Rules</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tune the underlying rule thresholds for the sequencing and anti-abuse verification engines.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
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
              <p className="text-[10px] text-slate-400">Default: 60 mins (1 hour)</p>
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
              <p className="text-[10px] text-slate-400">Default: 200 meters max</p>
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{savingSettings ? 'Saving...' : 'Update Policy Parameters'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
