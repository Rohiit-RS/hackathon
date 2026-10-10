import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import ProjectCard from '../components/ProjectCard';
import ProjectDetailModal from '../components/ProjectDetailModal';
import VerificationModal from '../components/VerificationModal';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export default function CitizenDashboard({ onOpenReportModal }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeViewMode, setActiveViewMode] = useState('both'); // 'map', 'list', 'both'

  const [inspectingProject, setInspectingProject] = useState(null);
  const [verifyingProject, setVerifyingProject] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedWard) params.ward = selectedWard;
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const data = await api.getProjects(params);
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [selectedWard, selectedDept, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Stats calculation
  const totalProjects = projects.length;
  const delayedCount = projects.filter(p => p.status === 'Delayed' || p.is_overdue).length;
  const disputedCount = projects.filter(p => p.status === 'Disputed').length;
  const confirmedCount = projects.filter(p => p.status === 'Citizen-confirmed').length;

  return (
    <div className="space-y-6">
      {/* Top Hero & Headline */}
      <div className="bg-gradient-to-br from-civic-900 via-civic-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-civic-500/30 text-civic-200 px-3 py-1 rounded-full border border-civic-400/30">
            Citizen Transparency Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Track Every Dig, Road, and Utility in Real-Time
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            See exactly who is digging your street, when work will finish, why delays happened, and how public money is spent. Verify progress physically on site to hold contractors accountable.
          </p>
        </div>

        {/* Quick KPI stats in Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
            <div className="text-slate-300 text-[11px]">Total Public Works</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{totalProjects}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
            <div className="text-emerald-300 text-[11px] flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Citizen-Confirmed
            </div>
            <div className="text-xl font-bold font-mono text-emerald-200 mt-0.5">{confirmedCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
            <div className="text-amber-300 text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Delayed Works
            </div>
            <div className="text-xl font-bold font-mono text-amber-200 mt-0.5">{delayedCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
            <div className="text-red-300 text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Disputed Sites
            </div>
            <div className="text-xl font-bold font-mono text-red-200 mt-0.5">{disputedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by street, project title, contractor, or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-500 text-slate-800"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setActiveViewMode('both')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeViewMode === 'both' ? 'bg-white shadow-xs text-civic-700' : 'text-slate-600'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeViewMode === 'map' ? 'bg-white shadow-xs text-civic-700' : 'text-slate-600'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setActiveViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeViewMode === 'list' ? 'bg-white shadow-xs text-civic-700' : 'text-slate-600'
              }`}
            >
              List Only
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50"
            >
              <option value="">All Wards & Zones</option>
              <option value="Ward 1">Ward 1 (Kamarajar)</option>
              <option value="Ward 2">Ward 2 (Gandhi Nagar)</option>
              <option value="Ward 3">Ward 3 (Temple Ward)</option>
              <option value="Ward 4">Ward 4 (Anna Nagar)</option>
              <option value="Ward 5">Ward 5 (Anna Nagar South)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50"
            >
              <option value="">All Departments</option>
              <option value="Sewage">Sewage Department</option>
              <option value="Water">Water Works Department</option>
              <option value="Storm Drainage">Storm Drainage</option>
              <option value="Roads">Roads & Highways</option>
              <option value="Electricity">Electricity Board</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50"
            >
              <option value="">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Delayed">Delayed</option>
              <option value="Citizen-confirmed">Citizen-confirmed</option>
              <option value="Disputed">Disputed</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setSelectedWard('');
                setSelectedDept('');
                setSelectedStatus('');
              }}
              className="w-full p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Map + List) */}
      <div className="space-y-6">
        {/* Interactive Map */}
        {(activeViewMode === 'map' || activeViewMode === 'both') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-civic-600" />
                <span>Geographic Map View (Click pins for budget & verification)</span>
              </span>
              <span className="text-slate-400 font-normal">
                {projects.length} sites geocoded
              </span>
            </div>
            <MapView
              projects={projects}
              onSelectProject={(proj) => setInspectingProject(proj)}
              onVerifyProject={(proj) => setVerifyingProject(proj)}
            />
          </div>
        )}

        {/* Project Cards List */}
        {(activeViewMode === 'list' || activeViewMode === 'both') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-civic-600" />
                <span>Public Works Projects Directory</span>
              </span>
              <span className="text-slate-500 font-normal">
                Showing {projects.length} projects
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                Loading public works records...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-sm text-slate-700">No Projects Found</p>
                <p>Try resetting filters or searching a different ward.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    onSelect={(p) => setInspectingProject(p)}
                    onVerify={(p) => setVerifyingProject(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {inspectingProject && (
        <ProjectDetailModal
          project={inspectingProject}
          onClose={() => setInspectingProject(null)}
          onRefresh={loadProjects}
          onOpenVerify={(p) => {
            setInspectingProject(null);
            setVerifyingProject(p);
          }}
        />
      )}

      {verifyingProject && (
        <VerificationModal
          project={verifyingProject}
          isOpen={true}
          onClose={() => setVerifyingProject(null)}
          onSuccess={() => {
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
