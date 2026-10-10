import React from 'react';
import {
  Calendar,
  Building,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  GitMerge,
  FileCheck2,
  HardHat
} from 'lucide-react';

export default function ProjectCard({ project, onSelect, onVerify }) {
  const percentSpent = project.sanctioned_budget > 0
    ? Math.min(100, Math.round((project.amount_spent / project.sanctioned_budget) * 100))
    : 0;

  const isOverBudget = project.budget_variance > 0;
  const isDelayed = project.status === 'Delayed' || project.is_overdue;
  const isDisputed = project.status === 'Disputed';
  const isConfirmed = project.status === 'Citizen-confirmed';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Header Badges */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono">
              {project.department_name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isDelayed && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Delayed
              </span>
            )}
            {isDisputed && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-300 font-mono animate-pulse">
                <ShieldAlert className="w-3 h-3 text-red-600" />
                Disputed
              </span>
            )}
            {isConfirmed && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                Social Audit Confirmed
              </span>
            )}
            {!isDelayed && !isDisputed && !isConfirmed && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {project.status}
              </span>
            )}
          </div>
        </div>

        {/* Work Order Title */}
        <h3
          onClick={() => onSelect(project)}
          className="text-sm font-extrabold text-slate-900 group-hover:text-civic-700 transition cursor-pointer line-clamp-2 mb-1.5 leading-snug"
        >
          {project.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3.5 leading-relaxed">
          {project.purpose || project.description}
        </p>

        {/* Location & Contract Metadata */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{project.address} ({project.ward})</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <HardHat className="w-3.5 h-3.5 text-slate-400" />
              Contractor:
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[170px]">
              {project.contractor_name}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Target Handover:
            </span>
            <span className={`font-mono font-bold ${isDelayed ? 'text-amber-800 underline' : 'text-slate-800'}`}>
              {project.expected_end_date}
            </span>
          </div>
        </div>

        {/* Dig-Once Sequence Indicator */}
        {project.dig_once_sequence && (
          <div className="mb-3.5 px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between text-[11px] text-purple-900 font-medium">
            <div className="flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-bold">Dig-Once Protocol:</span>
            </div>
            <span className="font-semibold text-purple-800 text-[10px] font-mono">
              {project.dig_once_sequence.role}
            </span>
          </div>
        )}

        {/* Budget Audit Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Sanctioned Outlay</span>
            <span className="font-extrabold font-mono text-slate-900">
              ₹{(project.sanctioned_budget / 100000).toFixed(2)} Lakhs
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-500' : 'bg-[#0284c7]'
              }`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
            <span>Disbursed: ₹{(project.amount_spent / 100000).toFixed(2)}L ({percentSpent}%)</span>
            {project.budget_variance !== 0 ? (
              <span className={`font-bold flex items-center gap-0.5 ${isOverBudget ? 'text-red-600' : 'text-emerald-700'}`}>
                {isOverBudget ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isOverBudget ? `+₹${(project.budget_variance / 1000).toFixed(0)}k Overrun` : `-₹${(Math.abs(project.budget_variance) / 1000).toFixed(0)}k Surplus`}
              </span>
            ) : (
              <span className="text-slate-400">Balanced</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(project)}
          className="text-xs font-bold text-[#0b2545] hover:text-civic-700 flex items-center gap-1 transition"
        >
          <span>Audit Sheet & Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onVerify(project)}
          className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Social Audit</span>
        </button>
      </div>
    </div>
  );
}
