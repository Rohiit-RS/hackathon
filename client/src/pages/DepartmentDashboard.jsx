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
  Check
} from 'lucide-react';

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [problemQueue, setProblemQueue] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildingWO, setBuildingWO] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, woData] = await Promise.all([
        api.getProblemQueue(),
        api.getWorkOrders()
      ]);
      setProblemQueue(queueData.prioritizedQueue || []);
      setWorkOrders(woData.workOrders || []);
    } catch (err) {
      console.error('Failed to load department coordination data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuildWorkOrder = async () => {
    try {
      setBuildingWO(true);
      setActionMessage(null);
      const res = await api.buildWorkOrder({
        customHandoffMinutes: 60,
        adminOverrideParallel: false
      });
      setActionMessage({ type: 'success', text: res.message });
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
            Automates the Dig-Once municipal workflow: clusters raw citizen complaints within 50m, rates severity (Major/Moderate/Minor), and sequences underground utilities prior to surface repaving with an automatic 1-hour handoff gap.
          </p>
        </div>

        <button
          onClick={handleBuildWorkOrder}
          disabled={buildingWO}
          className="bg-civic-600 hover:bg-civic-700 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md shadow-civic-600/30 flex items-center gap-2 active:scale-95 transition whitespace-nowrap"
        >
          <GitMerge className="w-4 h-4" />
          <span>{buildingWO ? 'Sequencing...' : 'Generate Coordinated Work Order'}</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
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

      {/* STEP 3 & ACTIVE WORK ORDERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-civic-700" />
              <span>Step 3: Active Coordinated Work Orders</span>
            </h2>
            <p className="text-xs text-slate-500">
              Underground utilities execute first. Secondary surface works begin 1 hour following primary completion.
            </p>
          </div>
          <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {workOrders.length} Work Orders Active
          </span>
        </div>

        <div className="grid gap-4">
          {workOrders.map((wo) => {
            const primary = wo.steps?.[0];
            const secondary = wo.steps?.[1];
            const isPrimaryDone = primary?.status === 'completed';
            const escalation = wo.escalation;

            return (
              <div
                key={wo.workOrderId}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5"
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

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                      Handoff Gap: {wo.handoffGapMinutes || 60} mins
                    </span>
                    {escalation?.isOverdue && (
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
                          Protected: Secondary is locked in pending to prevent redundant road destruction.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overdue Escalation Ladder Details */}
                {escalation?.isOverdue && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-950 space-y-1">
                    <div className="font-extrabold text-sm flex items-center gap-1.5 text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>{escalation.statusLabel}</span>
                    </div>
                    <p className="text-red-800 text-[11px]">
                      Expected deadline was missed by {escalation.hoursOverdue} hours. Secondary department arrival has been held in pending status so equipment is not mobilized prematurely.
                    </p>
                    <div className="text-[11px] font-semibold text-red-900 pt-1">
                      Enforced Action: {escalation.actionsRequired.join(' • ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1 & STEP 2: CLUSTERED & PRIORITIZED PROBLEM QUEUE */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Step 1 & 2: Clustered & Severity-Rated Problem Queue</span>
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

                  {/* Transparent Severity Reason */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Rule Triggered:</strong> {group.severityReason}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-slate-700">
                    <span className="bg-civic-100 text-civic-800 px-2 py-0.5 rounded-full text-[10px]">
                      {group.reportCount} Complaints Clustered
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Weight: {group.weightedReportCount}x
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
