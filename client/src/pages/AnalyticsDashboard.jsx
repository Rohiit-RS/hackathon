import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Building,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Award
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [overview, scorecards, hotspotData, warningData] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getScorecards(),
          api.getHotspots(),
          api.getEarlyWarnings()
        ]);

        setMetrics(overview.metrics || null);
        setDepartments(scorecards.departments || []);
        setContractors(scorecards.contractors || []);
        setHotspots(hotspotData.hotspots || []);
        setWarnings(warningData.warnings || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const chartData = departments.map((d) => ({
    name: d.category.toUpperCase(),
    Sanctioned: Math.round(d.sanctionedBudget / 100000),
    Spent: Math.round(d.amountSpent / 100000),
    Complaints: d.totalComplaints
  }));

  const COLORS = ['#8b5cf6', '#06b6d4', '#0284c7', '#eab308', '#ec4899', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-civic-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-civic-500/30 text-civic-200 px-3 py-1 rounded-full border border-civic-400/30">
            Step 5: Municipal Analytics & Early Warnings
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Department & Contractor Accountability Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real-time scorecards calculate complaint density per project, budget variance, delay frequency, and contractor performance ratings to catch structural problems before they multiply.
          </p>
        </div>

        {/* Overview Stats */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-slate-300 text-[11px]">Total Public Outlay</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                ₹{(metrics.totalSanctionedBudget / 100000).toFixed(1)} Lakhs
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-slate-300 text-[11px]">Total Disbursed</div>
              <div className="text-xl font-bold font-mono text-civic-300 mt-0.5">
                ₹{(metrics.totalAmountSpent / 100000).toFixed(1)} Lakhs
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-slate-300 text-[11px]">Fiscal Variance</div>
              <div className={`text-xl font-bold font-mono mt-0.5 ${
                metrics.budgetVariance > 0 ? 'text-red-300' : 'text-emerald-300'
              }`}>
                {metrics.budgetVariance > 0 ? `+₹${(metrics.budgetVariance / 1000).toFixed(0)}k` : `-₹${(Math.abs(metrics.budgetVariance) / 1000).toFixed(0)}k`}
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl">
              <div className="text-slate-300 text-[11px]">Delayed Projects</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                {metrics.delayedProjects} / {metrics.totalProjects}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Early Warning Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            <span>Automated Early Warning Signals</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {warnings.map((w) => (
              <div
                key={w.id}
                className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-red-200 text-red-900 font-mono">
                    {w.type} • {w.severity} Severity
                  </span>
                  <span className="font-bold text-red-900">{w.department}</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{w.projectTitle}</div>
                <p className="text-red-800 text-[11px]">{w.message}</p>
                <div className="text-[10px] font-bold text-slate-600 pt-1">
                  Enforced Next Step: <span className="underline">{w.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Sanctioned vs Spent Budget by Department (in Lakhs ₹)
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="Sanctioned" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Citizen Complaint Volume by Department
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="Complaints" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DEPARTMENT SCORECARDS */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-civic-700" />
          <span>Department Performance Scorecards</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.departmentId}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                    Tier {dept.tier} • {dept.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{dept.departmentName}</h3>
                  <div className="text-[11px] text-slate-500">Lead: {dept.headName}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Projects:</span>
                  <span className="font-bold text-slate-800">{dept.totalProjects} active</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Complaints:</span>
                  <span className="font-bold text-slate-800">{dept.totalComplaints} filed</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Delay Rate:</span>
                  <span className={`font-bold ${dept.delayRatePercentage > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {dept.delayRatePercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Response:</span>
                  <span className="font-bold text-slate-800">{dept.averageResponseTimeHours} hrs</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Sanctioned Outlay:</span>
                <span className="font-bold font-mono text-slate-800">
                  ₹{(dept.sanctionedBudget / 100000).toFixed(1)} Lakhs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTRACTOR SCORECARDS */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          <span>Contractor Public Compliance & Ratings</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contractors.map((cont) => (
            <div
              key={cont.contractorId}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-400">{cont.licenseNo}</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ★ {cont.rating} / 5.0
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{cont.name}</h3>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Works:</span>
                  <span className="font-bold font-mono">{cont.totalProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delayed Works:</span>
                  <span className={`font-bold font-mono ${cont.delayedProjects > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                    {cont.delayedProjects}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Citizen Disputes:</span>
                  <span className={`font-bold font-mono ${cont.disputedProjects > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {cont.disputedProjects}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Public Score:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                  cont.complianceScore > 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {cont.complianceScore} / 100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
