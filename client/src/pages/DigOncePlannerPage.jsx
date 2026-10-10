import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GitMerge,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function DigOncePlannerPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await api.getProjects();
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          // Select 3rd Main Road or first project
          const defaultTarget = data.projects.find(p => p.category === 'roads' || p.category === 'sewage') || data.projects[0];
          setSelectedProject(defaultTarget);
        }
      } catch (err) {
        console.error('Failed to load projects for dig-once:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function checkConflicts() {
      if (!selectedProject) return;
      try {
        setLoadingConflicts(true);
        const res = await api.getProjectConflicts(selectedProject.id);
        setConflicts(res.conflicts || []);
      } catch (err) {
        console.error('Failed to evaluate conflicts:', err);
      } finally {
        setLoadingConflicts(false);
      }
    }
    checkConflicts();
  }, [selectedProject]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full border border-purple-400/30">
            Step 4: Dig-Once Conflict Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Prevent Repeated Street Excavation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Eliminates the #1 citizen frustration: newly paved roads dug up weeks later by another department. This engine scans planned work orders within 150m and 3 months, enforcing joint trenching and synchronized execution.
          </p>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Selector Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
            <span>Select Target Project</span>
            <span className="text-xs font-mono font-normal text-slate-400">{projects.length} Available</span>
          </h2>
          <p className="text-xs text-slate-500">
            Choose a planned or active project to scan surrounding coordinates for excavation collisions.
          </p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`w-full p-3 rounded-2xl border text-left transition ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-slate-500">{proj.department_name}</span>
                    <span className="font-mono text-purple-700">{proj.category}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">{proj.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {proj.address} ({proj.ward})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conflict Detection Results */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProject && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
              {/* Selected Target Header */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Inspected Work Order
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedProject.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProject.address}
                  </span>
                  <span>•</span>
                  <span>Timeline: {selectedProject.start_date} to {selectedProject.expected_end_date}</span>
                </div>
              </div>

              {/* Conflict Findings */}
              {loadingConflicts ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Scanning spatial-temporal road corridor...
                </div>
              ) : conflicts.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm">No Dig-Once Conflicts Detected</h4>
                  <p className="text-xs text-emerald-800">
                    No other utility or road department has scheduled excavations within 150m in the next 3 months. Safe to proceed with single-project scheduling.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-700 flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      {conflicts.length} Dig-Once Conflict Collision(s) Flagged!
                    </span>
                    <span className="text-xs text-slate-400">Spatial Radius: 150m • Window: 90 Days</span>
                  </div>

                  {conflicts.map((conf) => (
                    <div
                      key={conf.conflictId}
                      className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 text-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">
                            {conf.severity} ({conf.distanceMeters}m away)
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                            {conf.conflictingProjectTitle}
                          </h4>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Scheduled by: <strong>{conf.conflictingDepartment}</strong> ({conf.conflictingContractor})
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-white text-slate-700 border border-amber-200">
                          {conf.existingStartDate} to {conf.existingEndDate}
                        </span>
                      </div>

                      {/* Engine Automated Recommendation */}
                      <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-slate-800 text-xs">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Municipal Recommendation:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {conf.recommendation}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => alert('Synchronization Request Dispatched to ' + conf.conflictingDepartment)}
                          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Initiate Joint Trenching Synchronization</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
