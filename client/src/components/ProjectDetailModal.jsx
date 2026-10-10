import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  GitMerge,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Send,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProjectDetailModal({ project, onClose, onRefresh, onOpenVerify }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, budget, delay_log, dig_once, verifications
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(project.status);
  const [newEndDate, setNewEndDate] = useState(project.expected_end_date);
  const [delayReason, setDelayReason] = useState('');
  const [spentInput, setSpentInput] = useState(project.amount_spent);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!project) return null;

  const isOfficerOrAdmin = user?.role === 'department_officer' || user?.role === 'admin';
  const isDelayed = project.status === 'Delayed' || project.is_overdue;
  const isDisputed = project.status === 'Disputed';
  const isConfirmed = project.status === 'Citizen-confirmed';

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setStatusUpdating(true);
      setFeedbackMsg(null);

      // Check if deadline was changed without a reason
      if (newEndDate !== project.expected_end_date && (!delayReason || delayReason.trim().length < 5)) {
        throw new Error('Mandatory Policy: A formal justification (delay reason) is strictly required to extend a deadline.');
      }

      await api.updateProjectStatus(project.id, {
        status: newStatus,
        new_end_date: newEndDate,
        delay_reason: delayReason,
        amount_spent: spentInput
      });

      setFeedbackMsg({ type: 'success', text: 'Project updated successfully with audit trail.' });
      setDelayReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-civic-900 text-white flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {project.department_name}
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                ID: {project.id}
              </span>
              {project.severity && (
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono ${
                  project.severity === 'Major'
                    ? 'bg-red-500 text-white'
                    : project.severity === 'Moderate'
                    ? 'bg-amber-500 text-slate-900 font-bold'
                    : 'bg-blue-500 text-white'
                }`}>
                  {project.severity} Priority
                </span>
              )}
              {isDelayed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Delayed
                </span>
              )}
              {isDisputed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-400 text-red-950 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Disputed
                </span>
              )}
              {isConfirmed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Citizen-confirmed
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug">
              {project.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-civic-400" />
              <span>{project.address} ({project.ward})</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'overview', label: 'Overview & Timeline' },
            { id: 'budget', label: 'Budget Transparency' },
            { id: 'delay_log', label: `Delay History (${project.delay_history?.length || 0})` },
            { id: 'dig_once', label: 'Dig-Once Schedule' },
            { id: 'verifications', label: 'Citizen Verifications' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-civic-600 text-civic-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & TIMELINE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Purpose & Description */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Public Purpose & Statement
                </h4>
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {project.purpose}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Authority & Contractor Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <Building className="w-4 h-4 text-civic-600" />
                    <span>Responsible Authority</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{project.department_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Designation: Executive Engineering Division
                  </div>
                  <div className="text-xs text-slate-500">
                    Jurisdiction: {project.ward}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>Executing Contractor</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{project.contractor_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    PWD License: TN-PWD-8421
                  </div>
                  <div className="text-xs text-slate-500">
                    Claimed Status: <span className="font-semibold uppercase">{project.contractor_claimed_status}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Official Public Timeline
                </h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {(project.timeline || []).map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 pl-8">
                      <span className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        step.status === 'completed'
                          ? 'bg-emerald-500'
                          : step.status === 'delayed'
                          ? 'bg-amber-500'
                          : step.status === 'disputed'
                          ? 'bg-red-500'
                          : 'bg-civic-500'
                      }`} />
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{step.title}</span>
                          <span className="font-mono text-slate-400 text-[11px]">{step.date}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{step.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUDGET TRANSPARENCY */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Sanctioned Budget</div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    ₹{(project.sanctioned_budget || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Approved public outlay</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Amount Spent So Far</div>
                  <div className="text-xl font-extrabold text-civic-700 font-mono">
                    ₹{(project.amount_spent || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Disbursed invoices</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Maintenance Cost</div>
                  <div className="text-xl font-extrabold text-slate-800 font-mono">
                    ₹{(project.maintenance_budget || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">5-year warranty reserve</div>
                </div>
              </div>

              {/* Budget Variance Analysis Card */}
              <div className={`p-4 rounded-2xl border ${
                project.budget_variance > 0
                  ? 'bg-red-50/70 border-red-200 text-red-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    Fiscal Variance Audit
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    project.budget_variance > 0 ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {project.budget_variance > 0 ? 'Cost Overrun' : 'Under Budget'}
                  </span>
                </div>
                <div className="text-sm font-semibold">
                  Variance: ₹{Math.abs(project.budget_variance || 0).toLocaleString()} ({project.variance_percentage || 0}%)
                </div>
                <p className="text-xs opacity-80 mt-1">
                  {project.budget_variance > 0
                    ? 'Warning: Expenditures currently exceed the municipal sanctioned cap. Requires audit review.'
                    : 'Expenditures are currently within sanctioned financial allocations.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DELAY HISTORY LOG */}
          {activeTab === 'delay_log' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Mandatory Delay Explanations</h4>
                  <p className="text-xs text-slate-500">
                    Municipal Policy: Every deadline change requires formal public reasoning.
                  </p>
                </div>
                {isDelayed && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                    Delayed Project
                  </span>
                )}
              </div>

              {(!project.delay_history || project.delay_history.length === 0) ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-sm">No Deadline Slippages Logged</p>
                  <p className="text-emerald-700 mt-1">This project has maintained its original target deadline of {project.original_end_date || project.expected_end_date}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.delay_history.map((delay, idx) => (
                    <div key={idx} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-xs">
                          Revision #{idx + 1}: Deadline Extended to {delay.new_end_date}
                        </span>
                        <span className="text-[11px] font-mono text-amber-700">
                          {new Date(delay.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 text-slate-700 font-medium">
                        "{delay.reason}"
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-amber-800">
                        <span>Original Target: {delay.old_end_date}</span>
                        <span>Authorized By: <strong>{delay.authorized_by}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIG-ONCE SCHEDULE */}
          {activeTab === 'dig_once' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs text-purple-900">
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <GitMerge className="w-4 h-4 text-purple-600" />
                  <span>Dig-Once Multi-Department Policy</span>
                </div>
                <p className="text-purple-800 text-[11px]">
                  Underground utilities (Sewage/Water) are sequenced first. Surface road restoration is strictly scheduled 1 hour after underground backfill sign-off to ensure the road is not excavated twice!
                </p>
              </div>

              {project.dig_once_sequence ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">Assigned Sequence Role:</span>
                    <span className="font-extrabold text-civic-700 px-2 py-0.5 rounded bg-civic-50">
                      {project.dig_once_sequence.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Sequence Step:</span>
                    <span className="font-bold font-mono">
                      Step {project.dig_once_sequence.step_number} of {project.dig_once_sequence.total_steps}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Inter-Department Handoff Gap:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      {project.dig_once_sequence.handoff_gap_minutes || 60} Minutes
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {project.dig_once_sequence.subsequent_department && (
                      <p>Next Department Queued: <strong>{project.dig_once_sequence.subsequent_department}</strong></p>
                    )}
                    {project.dig_once_sequence.preceding_department && (
                      <p>Preceding Work By: <strong>{project.dig_once_sequence.preceding_department}</strong></p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Standalone municipal project. Not currently paired in a multi-department coordinated excavation.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CITIZEN VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Crowd-Verified Site Progress</h4>
                  <p className="text-xs text-slate-500">
                    Physical GPS checks within 200m and 3-resident quorum prevent false contractor sign-offs.
                  </p>
                </div>
                <button
                  onClick={() => onOpenVerify(project)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition"
                >
                  Verify Site Now
                </button>
              </div>

              {isDisputed && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-red-800">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Project Under Disputed Review</span>
                  </div>
                  <p className="text-red-700 text-[11px]">
                    The contractor marked this work completed, but multiple verified residents on site reported incomplete work or ongoing road hazards. An independent officer inspection has been triggered.
                  </p>
                </div>
              )}

              {/* Quorum Progress */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Citizen Quorum Threshold:</span>
                  <span className="font-mono">{project.quorum_status?.verified_count || (isConfirmed ? 3 : 1)} / 3 Residents</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (((project.quorum_status?.verified_count || (isConfirmed ? 3 : 1))) / 3) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isConfirmed
                    ? 'Quorum reached! Verified on-site by 3 independent registered residents.'
                    : 'A minimum of 3 independent citizen verifications within 200m is required for official citizen-confirmation.'}
                </p>
              </div>
            </div>
          )}

          {/* OFFICER / ADMIN MANAGEMENT DRAWER */}
          {isOfficerOrAdmin && (
            <div className="mt-8 pt-6 border-t border-slate-200 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-civic-800">
                  <Shield className="w-4 h-4 text-civic-600" />
                  <span>Department Officer & Admin Management</span>
                </div>
                <span className="text-[10px] bg-civic-100 text-civic-800 font-mono px-2 py-0.5 rounded font-bold">
                  Authorized: {user.name}
                </span>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                      <option value="Disputed">Disputed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target End Date</label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount Spent (₹)</label>
                    <input
                      type="number"
                      value={spentInput}
                      onChange={(e) => setSpentInput(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
                    />
                  </div>
                </div>

                {newEndDate !== project.expected_end_date && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 animate-fade-in">
                    <label className="block font-bold text-amber-900">
                      Mandatory Delay Justification (Required for Deadline Extension) *
                    </label>
                    <textarea
                      rows={2}
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="e.g. Unforeseen groundwater seepage required dewatering pumps, shifting timeline by 10 days."
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white text-slate-800 text-xs"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={statusUpdating}
                    className="flex items-center gap-1.5 bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{statusUpdating ? 'Updating...' : 'Save Public Updates'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            CivicTrack Open Data Standard • Municipal Code 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
