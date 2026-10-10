import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  GitMerge,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  ShieldAlert,
  ArrowRight,
  Flame,
  Zap,
  Wrench,
  Check,
  MessageSquare,
  Calendar,
  X,
  Filter,
  Send,
  RefreshCw,
  FileText,
  UserCheck
} from 'lucide-react';

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [problemQueue, setProblemQueue] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('work-orders'); // 'work-orders', 'problem-queue', 'grievance-desk'
  const [actionMessage, setActionMessage] = useState(null);

  // Modal states
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(null); // workOrderId
  const [showReassignModal, setShowReassignModal] = useState(null); // workOrderId
  const [showReplyModal, setShowReplyModal] = useState(null); // reportId

  // Work order builder form state
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [customHandoffMinutes, setCustomHandoffMinutes] = useState(60);
  const [adminOverrideParallel, setAdminOverrideParallel] = useState(false);
  const [buildingWO, setBuildingWO] = useState(false);

  // Delay form state
  const [delayReason, setDelayReason] = useState('');
  const [revisedCompletionDate, setRevisedCompletionDate] = useState('');
  const [submittingDelay, setSubmittingDelay] = useState(false);

  // Reassign form state
  const [newContractorName, setNewContractorName] = useState('L&T Infrastructure');
  const [reassignReason, setReassignReason] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Grievance filter
  const [reportFilterCategory, setReportFilterCategory] = useState('all');
  const [reportFilterStatus, setReportFilterStatus] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, woData, repData, adminData] = await Promise.all([
        api.getProblemQueue(),
        api.getWorkOrders(),
        api.getReports(),
        api.getAdminConfig().catch(() => ({ contractors: [] }))
      ]);
      setProblemQueue(queueData.prioritizedQueue || []);
      setWorkOrders(woData.workOrders || []);
      setReports(repData.reports || []);
      setContractors(adminData.contractors || []);

      // Preselect all group IDs for builder
      if (queueData.prioritizedQueue?.length > 0) {
        setSelectedGroupIds(queueData.prioritizedQueue.map((g) => g.groupId));
      }
    } catch (err) {
      console.error('Failed to load department coordination data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuildWorkOrder = async (e) => {
    e.preventDefault();
    try {
      setBuildingWO(true);
      setActionMessage(null);
      const res = await api.buildWorkOrder({
        problemGroupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        customHandoffMinutes: Number(customHandoffMinutes),
        adminOverrideParallel
      });
      setActionMessage({ type: 'success', text: res.message });
      setShowBuilderModal(false);
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setBuildingWO(false);
    }
  };

  const handleCompletePrimary = async (woId) => {
    try {
      setActionMessage(null);
      const res = await api.completePrimaryWorkOrder(woId);
      setActionMessage({ type: 'success', text: res.message });
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleLogDelay = async (e) => {
    e.preventDefault();
    if (!delayReason.trim()) {
      setActionMessage({ type: 'error', text: 'Delay justification is required' });
      return;
    }
    try {
      setSubmittingDelay(true);
      setActionMessage(null);
      const res = await api.logWorkOrderDelay(showDelayModal, {
        reason: delayReason,
        revisedCompletionDate: revisedCompletionDate || undefined
      });
      setActionMessage({ type: 'success', text: res.message });
      setShowDelayModal(null);
      setDelayReason('');
      setRevisedCompletionDate('');
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingDelay(false);
    }
  };

  const handleReleaseSecondary = async (woId) => {
    try {
      setActionMessage(null);
      const res = await api.releaseSecondaryWorkOrder(woId);
      setActionMessage({ type: 'success', text: res.message });
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleReassignWorkOrder = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReassign(true);
      setActionMessage(null);
      const res = await api.reassignWorkOrder(showReassignModal, {
        newContractor: newContractorName,
        reason: reassignReason || 'Reassigned due to unresolved Level 2 delay breach'
      });
      setActionMessage({ type: 'success', text: res.message });
      setShowReassignModal(null);
      setReassignReason('');
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingReassign(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      setActionMessage(null);
      const res = await api.replyToReport(showReplyModal, replyText, replyStatus);
      setActionMessage({ type: 'success', text: 'Official department response published!' });
      setShowReplyModal(null);
      setReplyText('');
      await loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (reportFilterCategory !== 'all' && r.category !== reportFilterCategory) return false;
    if (reportFilterStatus !== 'all' && r.status !== reportFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-civic-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-400 text-amber-950 px-3 py-1 rounded-full">
            Department Coordination & Feedback Engine
          </span>
          <h1 className="text-2xl font-black mt-2">
            Multi-Department Coordinated Work Orders
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Automates the Dig-Once municipal workflow: clusters citizen complaints within 50m, rates severity (Major/Moderate/Minor), and sequences underground utilities prior to surface repaving with deterministic handoffs.
          </p>
        </div>

        <button
          onClick={() => {
            setActionMessage(null);
            setShowBuilderModal(true);
          }}
          className="bg-civic-600 hover:bg-civic-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-civic-600/30 flex items-center gap-2 active:scale-95 transition whitespace-nowrap shrink-0"
        >
          <GitMerge className="w-4 h-4" />
          <span>Configure & Build Work Order</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('work-orders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'work-orders'
              ? 'border-civic-700 text-civic-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Active Work Orders ({workOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('problem-queue')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'problem-queue'
              ? 'border-civic-700 text-civic-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Clustered Problem Queue ({problemQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grievance-desk')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'grievance-desk'
              ? 'border-civic-700 text-civic-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-civic-600" />
          <span>Officer Grievance Reply Desk ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE WORK ORDERS */}
      {activeTab === 'work-orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-civic-700" />
                <span>Deterministic Work Orders in Execution</span>
              </h2>
              <p className="text-xs text-slate-500">
                Underground utilities execute first. Secondary surface works unlock upon primary completion + buffer.
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4">
            {workOrders.map((wo) => {
              const primary = wo.steps?.[0];
              const secondary = wo.steps?.[1];
              const isPrimaryDone = primary?.status === 'completed';
              const escalation = wo.escalation;
              const isOverdue = escalation?.isOverdue;

              return (
                <div
                  key={wo.workOrderId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
                >
                  {/* Work Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {wo.title || wo.workOrderId}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {wo.workOrderId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Site: {wo.locationAddress} ({wo.ward})
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                        Handoff Gap: {wo.handoffGapMinutes || 60} mins
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 animate-pulse">
                          Level {escalation.escalationLevel} Escalation: {escalation.escalationTarget}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tie-Break Explanation Banner */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <GitMerge className="w-4 h-4 text-civic-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Deterministic Sequencing Logic:</strong>{' '}
                      <span>{wo.tieBreakReason}</span>
                    </div>
                  </div>

                  {/* Steps Visual Chain */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Step 1: Primary Department */}
                    <div className={`p-4 rounded-2xl border relative ${
                      isPrimaryDone
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-civic-50/70 border-civic-300 text-civic-950'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white font-mono">
                          Step 1: Primary (Underground)
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPrimaryDone ? 'bg-emerald-200 text-emerald-800' : 'bg-civic-200 text-civic-800'
                        }`}>
                          {isPrimaryDone ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <div className="font-bold text-sm">{primary?.department || wo.primaryDepartment}</div>
                      <p className="text-xs opacity-80 mt-1">
                        {primary?.action || 'Replace underground mains and compact bedding'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
                        <span className="text-[11px] opacity-70">
                          Lead: {primary?.officerName || 'Er. Senthil Nathan (EE)'}
                        </span>
                        {!isPrimaryDone && (
                          <button
                            onClick={() => handleCompletePrimary(wo.workOrderId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Complete & Trigger Handoff</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Secondary Department */}
                    <div className={`p-4 rounded-2xl border relative ${
                      isPrimaryDone
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-90'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white font-mono text-slate-700">
                          Step 2: Secondary (Surface)
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPrimaryDone ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isPrimaryDone ? 'Arrival Scheduled' : 'Pending Primary Completion'}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-slate-900">
                        {secondary?.department || wo.secondaryDepartment}
                      </div>
                      <p className="text-xs opacity-80 mt-1">
                        {secondary?.action || 'Road resurfacing, bitumen overlay and traffic lane marking'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-black/10 text-[11px]">
                        {isPrimaryDone ? (
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Confirmed Arrival Time: {wo.secondaryConfirmedStartTime ? new Date(wo.secondaryConfirmedStartTime).toLocaleTimeString() : '1 Hour Elapsed'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            Protected: Secondary locked until underground excavation and backfill are certified.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delay Logs Trail */}
                  {wo.delayLogs && wo.delayLogs.length > 0 && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Officer Delay Justification Log</span>
                      </div>
                      {wo.delayLogs.map((log, idx) => (
                        <div key={idx} className="text-[11px] text-amber-900 bg-white/70 p-2 rounded-xl">
                          <div><strong>Reason:</strong> {log.reason}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Logged by {log.loggedBy} on {new Date(log.loggedAt).toLocaleString()}
                            {log.revisedCompletionDate && ` • New Target: ${log.revisedCompletionDate}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Overdue Escalation Ladder & Officer Action Buttons */}
                  {isOverdue && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-950 space-y-2.5">
                      <div className="font-extrabold text-sm flex items-center justify-between text-red-800">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{escalation.statusLabel}</span>
                        </div>
                        <span className="font-mono text-xs bg-red-100 px-2 py-0.5 rounded text-red-900">
                          {escalation.hoursOverdue} hrs overdue
                        </span>
                      </div>

                      <p className="text-red-800 text-[11px]">
                        Primary deadline breached. Municipal protocol enforces immediate justification logging or contract reassignment.
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {/* Button: Log Delay Justification */}
                        <button
                          onClick={() => {
                            setShowDelayModal(wo.workOrderId);
                            setDelayReason('');
                            setRevisedCompletionDate('');
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Log Delay Justification</span>
                        </button>

                        {/* Level 2 Action: Release Secondary in Parallel */}
                        <button
                          onClick={() => handleReleaseSecondary(wo.workOrderId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Release Secondary in Parallel (Level 2)</span>
                        </button>

                        {/* Level 2 Action: Reassign Contractor */}
                        <button
                          onClick={() => {
                            setShowReassignModal(wo.workOrderId);
                            setReassignReason('');
                          }}
                          className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Reassign Stalled Contract (Level 2)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEM QUEUE */}
      {activeTab === 'problem-queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Clustered & Severity-Rated Problem Queue</span>
              </h2>
              <p className="text-xs text-slate-500">
                Merges complaints within 50m radius. Rated Major (safety hazard / 10+ reports), Moderate, or Minor.
              </p>
            </div>
            <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {problemQueue.length} Aggregated Problems
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problemQueue.map((group) => {
              const isMajor = group.severity === 'Major';
              const isModerate = group.severity === 'Moderate';

              return (
                <div
                  key={group.groupId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {group.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isMajor
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isMajor && <Flame className="w-3 h-3 text-red-600" />}
                        {group.severity} Priority
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm capitalize">
                      {group.problemType}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {group.address} ({group.ward})
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                      <strong className="text-slate-800">Rule Triggered:</strong> {group.severityReason}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="bg-civic-100 text-civic-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {group.reportCount} Complaints Clustered
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Weight: {group.weightedReportCount}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: OFFICER GRIEVANCE REPLY DESK */}
      {activeTab === 'grievance-desk' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-civic-700" />
                <span>Officer Grievance Review & Response Desk</span>
              </h2>
              <p className="text-xs text-slate-500">
                Provide official engineering explanations, dispatch notices, and resolution statuses to citizen complaints.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={reportFilterCategory}
                onChange={(e) => setReportFilterCategory(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-700"
              >
                <option value="all">All Sectors</option>
                <option value="roads">Roads</option>
                <option value="water">Water</option>
                <option value="sewage">Sewage</option>
                <option value="electricity">Electricity</option>
              </select>

              <select
                value={reportFilterStatus}
                onChange={(e) => setReportFilterStatus(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{report.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {report.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-civic-100 text-civic-800">
                      {report.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      report.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : report.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Trust: {report.reporter_trust_score || 1.0}x
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>
                <div className="text-[11px] text-slate-500">
                  Location: <strong>{report.address}</strong> ({report.ward}) • Reported on: {new Date(report.created_at).toLocaleDateString()}
                </div>

                {/* Photos if any */}
                {report.photos && report.photos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {report.photos.map((photo, pIdx) => (
                      <img
                        key={pIdx}
                        src={photo.startsWith('http') ? photo : `http://localhost:5000${photo}`}
                        alt="Grievance evidence"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Officer Replies Trail */}
                {report.officerReplies && report.officerReplies.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <span className="font-extrabold text-slate-800 text-[11px] block">
                      Official Department Communications:
                    </span>
                    {report.officerReplies.map((r, rIdx) => (
                      <div key={rIdx} className="bg-white p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        <p className="text-slate-800 font-medium">"{r.message}"</p>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{r.officerName} ({r.departmentName})</span>
                          <span>{new Date(r.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowReplyModal(report.id);
                      setReplyText('');
                      setReplyStatus(report.status || 'in_progress');
                    }}
                    className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Official Department Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: COORDINATED WORK ORDER BUILDER */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-civic-700" />
                <h3 className="font-black text-slate-900 text-base">Dig-Once Coordinated Work Order Builder</h3>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select clustered problem groups to sequence. Underground utilities will be assigned Step 1; surface repaving will unlock only after handoff elapsed.
            </p>

            <form onSubmit={handleBuildWorkOrder} className="space-y-4 text-xs">
              {/* Problem Groups Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Select Problem Groups to Include ({selectedGroupIds.length} selected):
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2.5 bg-slate-50">
                  {problemQueue.map((grp) => {
                    const isChecked = selectedGroupIds.includes(grp.groupId);
                    return (
                      <label
                        key={grp.groupId}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 cursor-pointer hover:bg-slate-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupIds([...selectedGroupIds, grp.groupId]);
                            } else {
                              setSelectedGroupIds(selectedGroupIds.filter((id) => id !== grp.groupId));
                            }
                          }}
                          className="rounded text-civic-600 focus:ring-civic-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">
                            {grp.problemType} ({grp.ward})
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {grp.category} • {grp.reportCount} complaints • {grp.severity}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Handoff Buffer Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  Mandatory Surface Handoff Buffer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setCustomHandoffMinutes(mins)}
                      className={`p-2.5 rounded-xl font-bold border text-center transition ${
                        customHandoffMinutes === mins
                          ? 'bg-civic-700 text-white border-civic-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Surface road repaving is prevented from beginning until this buffer has elapsed after underground work completes.
                </p>
              </div>

              {/* Admin Parallel Override Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminOverrideParallel}
                  onChange={(e) => setAdminOverrideParallel(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">Parallel Non-Conflicting Ducts Override</span>
                  <span className="text-[11px] text-amber-800">
                    Allow underground utilities to operate concurrently if distinct conduits/trenches do not clash.
                  </span>
                </div>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buildingWO || selectedGroupIds.length === 0}
                  className="bg-civic-700 hover:bg-civic-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>{buildingWO ? 'Sequencing...' : 'Generate Work Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG DELAY JUSTIFICATION */}
      {showDelayModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Log Delay Justification</h3>
              </div>
              <button
                onClick={() => setShowDelayModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide mandatory engineering rationale for work order schedule overrun to pause Level 2 reassignment escalations.
            </p>

            <form onSubmit={handleLogDelay} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Delay Rationale & Unforeseen Site Conditions *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Encountered unmapped legacy high-voltage conduit requiring hand excavation..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Revised Target Completion Date</label>
                <input
                  type="date"
                  value={revisedCompletionDate}
                  onChange={(e) => setRevisedCompletionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDelayModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDelay}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{submittingDelay ? 'Saving...' : 'Submit Justification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN WORK ORDER */}
      {showReassignModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-slate-900 text-base">Level 2 Contract Reassignment</h3>
              </div>
              <button
                onClick={() => setShowReassignModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Reassign stalled public works contract to an accredited secondary contractor due to SLA breach.
            </p>

            <form onSubmit={handleReassignWorkOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Replacement Contractor *</label>
                <select
                  value={newContractorName}
                  onChange={(e) => setNewContractorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  {contractors.length > 0 ? (
                    contractors.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.specialty || 'General'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="L&T Infrastructure">L&T Infrastructure</option>
                      <option value="Afcons Infrastructure Ltd">Afcons Infrastructure Ltd</option>
                      <option value="Shapoorji Pallonji Urban">Shapoorji Pallonji Urban</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reassignment Executive Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Level 2 SLA grace period elapsed without progress..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign}
                  className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{submittingReassign ? 'Reassigning...' : 'Execute Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFFICER GRIEVANCE REPLY */}
      {showReplyModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-civic-700" />
                <h3 className="font-black text-slate-900 text-base">Official Department Communication</h3>
              </div>
              <button
                onClick={() => setShowReplyModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Post an official engineering update to the reporting resident and update ticket status.
            </p>

            <form onSubmit={handleSendReply} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Ticket Status</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="under_review">Under Review / Inspection</option>
                  <option value="in_progress">In Progress (Crew Dispatched)</option>
                  <option value="resolved">Resolved (Work Completed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Engineering Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Site inspected by Assistant Engineer. Work order sequenced for asphalt restoration within 48 hours..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="bg-civic-700 hover:bg-civic-800 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Sending...' : 'Publish Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
