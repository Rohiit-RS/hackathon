import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  IndianRupee,
  Clock,
  ShieldCheck,
  AlertCircle,
  Wrench,
  Eye,
  Crosshair,
  Layers,
  MapPin,
  ShieldAlert,
  HardHat,
  PlusCircle,
  Calendar,
  Flame,
  Zap,
  Filter,
  CheckCircle2,
  Move,
  ChevronDown,
  ChevronUp,
  X,
  Building,
  Users,
  Compass,
  GitMerge,
  Info,
  Search,
  RotateCcw,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Category SVG Icons for Departments
function getCategorySvg(category = 'roads') {
  switch (category.toLowerCase()) {
    case 'sewage':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'water':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
    case 'drainage':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M7 12h10M10 18h4"/></svg>`;
    case 'electricity':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'telecom':
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>`;
    default:
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`;
  }
}

const CATEGORY_COLORS = {
  sewage: '#7c3aed', // deep purple
  water: '#0891b2', // cyan
  drainage: '#0284c7', // civic blue
  electricity: '#d97706', // amber
  telecom: '#db2777', // pink
  roads: '#ea580c', // orange
  general: '#475569'
};

// Department Sanctioned Work Order Marker
function createEnterpriseMarker(category = 'roads', status = '') {
  const color = CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.general;
  const isDelayed = status === 'Delayed';
  const isDisputed = status === 'Disputed';
  const isConfirmed = status === 'Citizen-confirmed';

  const badgeColor = isDisputed ? '#ef4444' : isDelayed ? '#f59e0b' : isConfirmed ? '#10b981' : '#ffffff';
  const svg = getCategorySvg(category);

  return L.divIcon({
    className: 'custom-enterprise-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: ${color};
        color: white;
        border: 2.5px solid ${badgeColor};
        box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -2px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${svg}
        ${isDisputed ? '<span style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; border-radius: 50%; background: #ef4444; border: 2px solid white;"></span>' : ''}
        <span style="position: absolute; bottom: -7px; font-size: 8px; font-weight: 800; background: #0b2545; color: white; padding: 1px 4px; border-radius: 4px; text-transform: uppercase; font-family: monospace; white-space: nowrap;">DEPT</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}

// Citizen-Reported Issue Marker (Based on Severity & Complaint Volume)
function createCitizenIssueMarker(severity = 'Moderate', reportCount = 1, problemType = '') {
  const isMajor = severity === 'Major';
  const isModerate = severity === 'Moderate';

  const bgColor = isMajor ? '#dc2626' : isModerate ? '#d97706' : '#2563eb';
  const countBadgeBg = isMajor ? '#7f1d1d' : isModerate ? '#78350f' : '#1e3a8a';
  const isPulsing = isMajor || reportCount >= 10;

  return L.divIcon({
    className: 'custom-citizen-issue-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: ${bgColor};
        color: white;
        border: 2.5px solid #ffffff;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        ${isPulsing ? 'animation: pulse 1.8s infinite;' : ''}
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${isMajor
            ? '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>'
            : isModerate
            ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
          }
        </svg>

        <!-- Citizen Complaint Volume Badge -->
        <span style="
          position: absolute;
          top: -6px;
          right: -8px;
          background: ${countBadgeBg};
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 9999px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          font-family: monospace;
        ">
          ${reportCount}
        </span>

        <!-- Citizen Label -->
        <span style="
          position: absolute;
          bottom: -7px;
          font-size: 8px;
          font-weight: 800;
          background: #1e293b;
          color: #f1f5f9;
          padding: 1px 4px;
          border-radius: 4px;
          text-transform: uppercase;
          font-family: monospace;
          white-space: nowrap;
        ">
          PUBLIC
        </span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
}

// Draggable Maintenance Pin Icon
function createDraggablePinIcon() {
  return L.divIcon({
    className: 'custom-draggable-maintenance-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: grab;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #0f172a;
          border: 3px solid #fbbf24;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          color: #fbbf24;
        ">
          <svg style="transform: rotate(45deg);" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div style="
          margin-top: 4px;
          background: #0f172a;
          color: #fbbf24;
          border: 1px solid #fbbf24;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-family: monospace;
          white-space: nowrap;
          text-transform: uppercase;
        ">
          📍 Drag to Position
        </div>
      </div>
    `,
    iconSize: [42, 60],
    iconAnchor: [21, 55],
    popupAnchor: [0, -55]
  });
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Map Click Listener to relocate draggable pin in maintenance mode
function MapClickHandler({ isMaintenanceMode, onLocationSelected }) {
  useMapEvents({
    click: (e) => {
      if (isMaintenanceMode && onLocationSelected) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function MapView({
  projects = [],
  citizenIssues = [],
  selectedProject = null,
  onSelectProject,
  onVerifyProject,
  onProjectCreated,
  onReportIssueAtLocation
}) {
  const { user } = useAuth();
  const defaultCenter = [12.8342, 79.7036];
  const center = selectedProject
    ? [selectedProject.latitude, selectedProject.longitude]
    : defaultCenter;

  const [tileMode, setTileMode] = useState('street'); // 'street' or 'light'

  // Search & Issue Filter states
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [selectedIssueTag, setSelectedIssueTag] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('all'); // 'all', 'Major', 'Moderate', 'Minor'
  const [showDeptProjects, setShowDeptProjects] = useState(true);
  const [showCitizenIssues, setShowCitizenIssues] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(true);

  const issueTags = [
    { id: 'all', label: 'All Issues' },
    { id: 'pothole', label: '#pothole' },
    { id: 'sewage_leak', label: '#sewage_leak' },
    { id: 'pipeline_burst', label: '#pipeline_burst' },
    { id: 'blocked_drain', label: '#blocked_drain' },
    { id: 'exposed_wire', label: '#exposed_wire' },
    { id: 'road_resurfacing', label: '#road_resurfacing' }
  ];

  const isAnyFilterActive =
    mapSearchQuery.trim() !== '' ||
    selectedIssueTag !== 'all' ||
    selectedCategoryFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    selectedSeverityFilter !== 'all';

  const resetAllFilters = () => {
    setMapSearchQuery('');
    setSelectedIssueTag('all');
    setSelectedCategoryFilter('all');
    setSelectedStatusFilter('all');
    setSelectedSeverityFilter('all');
    setShowDeptProjects(true);
    setShowCitizenIssues(true);
  };

  // MAINTENANCE PLANNING INTERFACE (Admins and Department Accounts)
  const isOfficerOrAdmin = user?.role === 'department_officer' || user?.role === 'admin';
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenancePin, setMaintenancePin] = useState({ lat: 12.83424, lng: 79.70363 });

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    purpose: '',
    category: user?.department?.toLowerCase().includes('water')
      ? 'water'
      : user?.department?.toLowerCase().includes('sewage')
      ? 'sewage'
      : 'roads',
    severity: 'Moderate',
    ward: 'Ward 4 (Anna Nagar)',
    address: 'Gandhi Road Junction',
    sanctioned_budget: 2500000,
    maintenance_type: 'Scheduled Dig-Once Overhaul',
    start_date: new Date().toISOString().split('T')[0],
    expected_end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractor_name: 'L&T Infrastructure Division'
  });
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);

  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  // Drag handler for maintenance pin
  const handlePinDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setMaintenancePin({ lat: position.lat, lng: position.lng });
    // Approximate ward from latitude
    if (position.lat > 12.84) {
      setMaintenanceForm(prev => ({ ...prev, ward: 'Ward 1 (Central Commercial)' }));
    } else if (position.lat < 12.83) {
      setMaintenanceForm(prev => ({ ...prev, ward: 'Ward 6 (Orikkai Corridor)' }));
    }
  };

  // Submit Maintenance Project
  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.title) {
      setMaintenanceStatus({ type: 'error', text: 'Maintenance title and scope are required' });
      return;
    }

    try {
      setSubmittingMaintenance(true);
      setMaintenanceStatus(null);
      setConflictWarning(null);

      const payload = {
        title: maintenanceForm.title,
        purpose: maintenanceForm.purpose || `${maintenanceForm.maintenance_type} for ${maintenanceForm.category}`,
        description: `${maintenanceForm.maintenance_type} scheduled by ${user?.name || 'Department Officer'}.`,
        category: maintenanceForm.category,
        severity: maintenanceForm.severity,
        department_name: user?.department || `${maintenanceForm.category.toUpperCase()} Division`,
        ward: maintenanceForm.ward,
        address: maintenanceForm.address,
        latitude: Number(maintenancePin.lat),
        longitude: Number(maintenancePin.lng),
        sanctioned_budget: Number(maintenanceForm.sanctioned_budget),
        start_date: maintenanceForm.start_date,
        expected_end_date: maintenanceForm.expected_end_date,
        contractor_name: maintenanceForm.contractor_name
      };

      const res = await api.createProject(payload);

      if (res.digOnceConflicts && res.digOnceConflicts.length > 0) {
        setConflictWarning(
          `Dig-Once Alert: ${res.digOnceConflicts.length} nearby excavation projects detected within 150m. Joint trenching recommended!`
        );
      }

      setMaintenanceStatus({
        type: 'success',
        text: 'Maintenance work order sanctioned and plotted to municipal grid!'
      });

      if (onProjectCreated) await onProjectCreated(res.project);

      setTimeout(() => {
        setIsMaintenanceMode(false);
        setMaintenanceStatus(null);
        setConflictWarning(null);
      }, 1800);
    } catch (err) {
      setMaintenanceStatus({ type: 'error', text: err.message || 'Failed to sanction maintenance' });
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  // Filter projects by search, category, status, severity, and issue tag
  const filteredProjects = projects.filter(p => {
    if (selectedSeverityFilter !== 'all' && p.severity !== selectedSeverityFilter) return false;
    if (selectedCategoryFilter !== 'all' && p.category?.toLowerCase() !== selectedCategoryFilter.toLowerCase()) return false;
    if (selectedStatusFilter !== 'all' && p.status?.toLowerCase() !== selectedStatusFilter.toLowerCase()) return false;

    if (selectedIssueTag !== 'all') {
      const tag = selectedIssueTag.toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      const pPurp = (p.purpose || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const fullText = `${pCat} ${pTitle} ${pPurp} ${pDesc}`;

      if (tag === 'pothole') {
        if (!fullText.includes('pothole') && !fullText.includes('crater') && !pCat.includes('road')) return false;
      } else if (tag === 'sewage_leak') {
        if (!fullText.includes('sewage') && !fullText.includes('sewer') && !fullText.includes('drain')) return false;
      } else if (tag === 'pipeline_burst') {
        if (!fullText.includes('water') && !fullText.includes('burst') && !fullText.includes('pipe')) return false;
      } else if (tag === 'blocked_drain') {
        if (!fullText.includes('drain') && !fullText.includes('storm')) return false;
      } else if (tag === 'exposed_wire') {
        if (!fullText.includes('elec') && !fullText.includes('wire') && !fullText.includes('cable') && !fullText.includes('power')) return false;
      } else if (tag === 'road_resurfacing') {
        if (!fullText.includes('resurfac') && !fullText.includes('relay') && !fullText.includes('bitumen') && !fullText.includes('pave')) return false;
      } else {
        if (!fullText.includes(tag)) return false;
      }
    }

    if (mapSearchQuery.trim()) {
      const q = mapSearchQuery.toLowerCase().trim();
      const searchTarget = `${p.title || ''} ${p.description || ''} ${p.purpose || ''} ${p.address || ''} ${p.ward || ''} ${p.contractor_name || ''} ${p.department_name || ''} ${p.category || ''} ${p.status || ''}`.toLowerCase();
      if (!searchTarget.includes(q)) return false;
    }

    return true;
  });

  // Filter citizen issues by search, category, severity, and issue tag
  const filteredCitizenIssues = citizenIssues.filter(issue => {
    if (selectedSeverityFilter !== 'all' && issue.severity !== selectedSeverityFilter) return false;
    if (selectedCategoryFilter !== 'all' && issue.category?.toLowerCase() !== selectedCategoryFilter.toLowerCase()) return false;

    const pType = (issue.problemType || issue.problem_type || '').toLowerCase();
    const cat = (issue.category || '').toLowerCase();
    const fullText = `${pType} ${cat} ${issue.address || ''} ${issue.ward || ''} ${issue.severityReason || ''}`.toLowerCase();

    if (selectedIssueTag !== 'all') {
      const tag = selectedIssueTag.toLowerCase();
      if (tag === 'pothole') {
        if (!fullText.includes('pothole') && !fullText.includes('crater') && !cat.includes('road')) return false;
      } else if (tag === 'sewage_leak') {
        if (!fullText.includes('sewage') && !fullText.includes('sewer') && !fullText.includes('overflow')) return false;
      } else if (tag === 'pipeline_burst') {
        if (!fullText.includes('water') && !fullText.includes('burst') && !fullText.includes('pipe')) return false;
      } else if (tag === 'blocked_drain') {
        if (!fullText.includes('drain') && !fullText.includes('waterlog')) return false;
      } else if (tag === 'exposed_wire') {
        if (!fullText.includes('wire') && !fullText.includes('cable') && !cat.includes('elec')) return false;
      } else if (tag === 'road_resurfacing') {
        if (!fullText.includes('resurfac') && !fullText.includes('road')) return false;
      } else {
        if (!fullText.includes(tag)) return false;
      }
    }

    if (mapSearchQuery.trim()) {
      const q = mapSearchQuery.toLowerCase().trim();
      if (!fullText.includes(q)) return false;
    }

    return true;
  });

  const totalVisibleCount = (showDeptProjects ? filteredProjects.length : 0) + (showCitizenIssues ? filteredCitizenIssues.length : 0);

  return (
    <div className="relative isolate w-full h-[580px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 flex">
      {/* Map Surface */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <ChangeView center={center} zoom={selectedProject ? 15 : 13} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrls[tileMode]}
          />

          <MapClickHandler
            isMaintenanceMode={isMaintenanceMode}
            onLocationSelected={(lat, lng) => setMaintenancePin({ lat, lng })}
          />

          {/* 1. DEPARTMENT SANCTIONED PUBLIC WORKS MARKERS */}
          {showDeptProjects && filteredProjects.map((project) => {
            if (!project.latitude || !project.longitude) return null;
            const icon = createEnterpriseMarker(project.category, project.status);

            return (
              <Marker
                key={`proj_${project.id}`}
                position={[project.latitude, project.longitude]}
                icon={icon}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[270px] max-w-[310px]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                        {project.department_name}
                      </span>
                      <div className="flex items-center gap-1">
                        {project.severity && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                            project.severity === 'Major'
                              ? 'bg-red-100 text-red-800'
                              : project.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {project.severity}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          project.status === 'Delayed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : project.status === 'Disputed'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : project.status === 'Citizen-confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      🏛️ Department Sanctioned Project
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2 leading-snug">
                      {project.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      {project.address} ({project.ward})
                    </p>

                    <div className="bg-slate-50 rounded-xl p-2.5 mb-2.5 border border-slate-200/60 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sanctioned Outlay:</span>
                        <span className="font-bold text-slate-900">
                          ₹{(project.sanctioned_budget / 100000).toFixed(2)} Lakhs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timeframe:</span>
                        <span className="font-semibold text-slate-700">
                          {project.start_date || 'Ongoing'} &rarr; {project.expected_end_date || 'In Progress'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Executing Contractor:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                          {project.contractor_name || 'Department Division'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => onSelectProject && onSelectProject(project)}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-[#0b2545] hover:bg-[#134074] text-white py-1.5 rounded-lg shadow-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit Record</span>
                      </button>
                      {onVerifyProject && (
                        <button
                          onClick={() => onVerifyProject(project)}
                          className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg shadow-xs transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Social Audit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 2. CITIZEN-REPORTED ISSUES & CLUSTERS (BASED ON SEVERITY & REPORT COUNT) */}
          {showCitizenIssues && filteredCitizenIssues.map((issue) => {
            if (!issue.latitude || !issue.longitude) return null;
            const issueIcon = createCitizenIssueMarker(
              issue.severity,
              issue.reportCount || 1,
              issue.problemType
            );

            return (
              <Marker
                key={`issue_${issue.groupId || issue.id}`}
                position={[issue.latitude, issue.longitude]}
                icon={issueIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[270px] max-w-[310px] space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                        #{issue.problemType || issue.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        issue.severity === 'Major'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : issue.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity === 'Major' && <Flame className="w-3 h-3 text-red-600" />}
                        {issue.severity} Priority
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-civic-700" />
                        <span>Reported by Public • <strong>{issue.reportCount || 1} Citizen{issue.reportCount > 1 ? 's' : ''} Corroborated</strong></span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-0.5 capitalize">
                        {issue.problemType} ({issue.category})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {issue.address} ({issue.ward})
                      </p>
                    </div>

                    {/* Rule / Transparency reason */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
                      <strong>Severity Rule:</strong> {issue.severityReason || `${issue.reportCount || 1} resident reports within 50m radius.`}
                    </div>

                    {/* Photos Preview if available */}
                    {issue.photos && issue.photos.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {issue.photos.map((photo, pIdx) => (
                          <img
                            key={pIdx}
                            src={photo.startsWith('http') ? photo : `http://localhost:5000${photo}`}
                            alt="Grievance evidence"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-1 flex items-center gap-1.5 border-t border-slate-100">
                      {isOfficerOrAdmin ? (
                        <button
                          onClick={() => {
                            setIsMaintenanceMode(true);
                            setMaintenancePin({ lat: issue.latitude, lng: issue.longitude });
                            setMaintenanceForm(prev => ({
                              ...prev,
                              title: `Maintenance Resolution: ${issue.problemType}`,
                              address: issue.address,
                              ward: issue.ward,
                              category: issue.category
                            }));
                          }}
                          className="w-full flex items-center justify-center gap-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded-lg shadow-xs transition"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Schedule Maintenance Here</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onReportIssueAtLocation && onReportIssueAtLocation(issue)}
                          className="w-full flex items-center justify-center gap-1 text-[11px] font-bold bg-civic-700 hover:bg-civic-800 text-white py-1.5 rounded-lg shadow-xs transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Corroborate / Add Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 3. INTERACTIVE DRAGGABLE PIN IN MAINTENANCE PLANNING MODE */}
          {isMaintenanceMode && (
            <Marker
              draggable={true}
              eventHandlers={{ dragend: handlePinDragEnd }}
              position={[maintenancePin.lat, maintenancePin.lng]}
              icon={createDraggablePinIcon()}
            >
              <Popup>
                <div className="p-1 text-xs font-semibold text-slate-800">
                  <div className="font-bold text-amber-800 flex items-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    <span>Target Maintenance Site</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 mt-1">
                    Lat: {maintenancePin.lat.toFixed(6)}, Lng: {maintenancePin.lng.toFixed(6)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Drag and release anywhere to calibrate site position.
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* 1. FLOATING SEARCH & SPECIFIC ISSUE FILTER BAR */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 max-w-[340px] sm:max-w-[420px] w-[calc(100%-140px)] sm:w-auto pointer-events-auto">
          {/* Search Input Bar */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-1.5 flex items-center gap-2">
            <div className="pl-2 text-slate-400">
              <Search className="w-4 h-4 text-civic-700" />
            </div>
            <input
              type="text"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Search map: e.g. pothole, sewage, Anna Nagar, L&T..."
              className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium py-1"
            />
            {mapSearchQuery && (
              <button
                type="button"
                onClick={() => setMapSearchQuery('')}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Quick Specific Issue Filter Carousel Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {issueTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedIssueTag(tag.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-xs backdrop-blur-md transition flex items-center gap-1 ${
                  selectedIssueTag === tag.id
                    ? 'bg-slate-900 text-white border border-slate-900 scale-102'
                    : 'bg-white/90 text-slate-700 border border-slate-200/90 hover:bg-white'
                }`}
              >
                {tag.id !== 'all' && <Tag className="w-2.5 h-2.5 text-amber-400" />}
                <span>{tag.label}</span>
              </button>
            ))}
          </div>

          {/* Filter Status Badge */}
          {isAnyFilterActive && (
            <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-medium shadow-md flex items-center justify-between w-fit gap-2">
              <span>
                Found <strong className="text-amber-300 font-bold">{totalVisibleCount}</strong> items on map
                ({filteredProjects.length} dept, {filteredCitizenIssues.length} citizen)
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-amber-400 hover:text-amber-200 underline text-[10px] font-bold ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* MAP TOP CONTROLS: LAYER SWITCHER & MAINTENANCE TRIGGER */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-2">
          {isOfficerOrAdmin && (
            <button
              onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition ${
                isMaintenanceMode
                  ? 'bg-amber-500 text-amber-950 ring-2 ring-amber-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>{isMaintenanceMode ? 'Close Planning Mode' : 'Schedule Maintenance on Map'}</span>
            </button>
          )}

          <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-semibold text-slate-700">
            <button
              onClick={() => setTileMode('street')}
              className={`px-2.5 py-1 rounded-lg transition ${
                tileMode === 'street' ? 'bg-[#0b2545] text-white font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Municipal Grid
            </button>
            <button
              onClick={() => setTileMode('light')}
              className={`px-2.5 py-1 rounded-lg transition ${
                tileMode === 'light' ? 'bg-[#0b2545] text-white font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Carto Light
            </button>
          </div>
        </div>

        {/* DRAG-TO-POSITION HINT BANNER WHEN MAINTENANCE MODE ACTIVE */}
        {isMaintenanceMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-400/40 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
            <Move className="w-4 h-4 text-amber-400" />
            <span>Drag the gold pin or click anywhere on the map to set maintenance location</span>
          </div>
        )}

        {/* MAP LEGEND OVERLAY (DEPARTMENT WORKS VS CITIZEN ISSUES) */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 text-xs transition-all max-w-[340px]">
          <div
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-100"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-700" />
              <span className="font-extrabold text-slate-900 text-xs">
                Map Legend & Layer Filters
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              {legendExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {legendExpanded && (
            <div className="p-3.5 space-y-3 max-h-[300px] overflow-y-auto">
              {/* Layer Visibility Toggles */}
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDeptProjects}
                    onChange={(e) => setShowDeptProjects(e.target.checked)}
                    className="rounded text-civic-600 focus:ring-civic-500"
                  />
                  <span className="text-slate-800">Department Works</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCitizenIssues}
                    onChange={(e) => setShowCitizenIssues(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-slate-800">Citizen Issues</span>
                </label>
              </div>

              {/* Specific Issue Tag Selector in Legend */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Specific Issue
                </span>
                <select
                  value={selectedIssueTag}
                  onChange={(e) => setSelectedIssueTag(e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-800 bg-slate-50"
                >
                  {issueTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Pills */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Category
                </span>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                  {['all', 'roads', 'sewage', 'water', 'drainage', 'electricity', 'telecom'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`py-1 rounded-lg border text-center capitalize transition ${
                        selectedCategoryFilter === cat
                          ? 'bg-civic-700 text-white border-civic-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter for Works */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Work Status
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                  {['all', 'In Progress', 'Delayed', 'Disputed', 'Citizen-confirmed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatusFilter(st)}
                      className={`py-1 px-1 rounded-lg border text-center transition truncate ${
                        selectedStatusFilter === st
                          ? 'bg-civic-700 text-white border-civic-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={st}
                    >
                      {st === 'all' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Filter Pills */}
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Issue Severity
                </span>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                  {['all', 'Major', 'Moderate', 'Minor'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverityFilter(sev)}
                      className={`py-1 rounded-lg border text-center transition ${
                        selectedSeverityFilter === sev
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sev === 'all' ? 'All' : sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset All Filters Button */}
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset All Map Filters</span>
                </button>
              )}

              {/* Section 1: Department Works Legend */}
              <div className="pt-1 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">
                  🏛️ Department Public Works (Square Pins)
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-purple-600 shrink-0"></span>
                    <span>Sewage (Tier 1 Deep)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-600 shrink-0"></span>
                    <span>Water Works (Tier 1)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600 shrink-0"></span>
                    <span>Storm Drains (Tier 2)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-600 shrink-0"></span>
                    <span>Power / Telecom (Tier 3)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-orange-600 shrink-0"></span>
                    <span>Road Paving (Tier 4)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-black/20 shrink-0"></span>
                    <span>Citizen-Confirmed</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Citizen-Reported Issues Legend */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 font-mono">
                  📢 Citizen-Reported Issues (Circular Pins)
                </span>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-300"></span>
                      <strong className="text-red-700">Major Severity:</strong>
                    </div>
                    <span className="text-[10px] text-slate-500">Hazard / 10+ reports / Stalled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <strong className="text-amber-700">Moderate Severity:</strong>
                    </div>
                    <span className="text-[10px] text-slate-500">4–9 reports / daily disruption</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <strong className="text-blue-700">Minor Severity:</strong>
                    </div>
                    <span className="text-[10px] text-slate-500">1–3 reports / localized</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Badge Number:</span>
                    <strong className="text-slate-800">Exact Citizens Reporting at Spot</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED MAINTENANCE SCHEDULING DRAWER (FOR ADMINS & DEPARTMENT OFFICERS) */}
      {isMaintenanceMode && (
        <div className="w-80 sm:w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-[1000] animate-fade-in text-xs">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-sm leading-tight">Mark Maintenance Zone</h3>
                <span className="text-[10px] text-slate-300">Inter-Department Work Order Sanction</span>
              </div>
            </div>
            <button
              onClick={() => setIsMaintenanceMode(false)}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleScheduleMaintenance} className="p-4 overflow-y-auto space-y-3.5 flex-1">
            {/* Draggable Coordinates Feedback */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <Move className="w-3.5 h-3.5 text-amber-700" />
                  <span>Target Site Coordinates</span>
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono">
                  Draggable
                </span>
              </div>
              <div className="font-mono text-[11px] text-amber-900">
                Lat: {maintenancePin.lat.toFixed(6)}, Lng: {maintenancePin.lng.toFixed(6)}
              </div>
              <p className="text-[10px] text-amber-800">
                Drag the gold pin on the map or click any spot to adjust location precision.
              </p>
            </div>

            {maintenanceStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                maintenanceStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {maintenanceStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{maintenanceStatus.text}</span>
              </div>
            )}

            {conflictWarning && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <GitMerge className="w-3.5 h-3.5 text-red-600" />
                  <span>Dig-Once Conflict Alert</span>
                </div>
                <p className="text-[11px]">{conflictWarning}</p>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1">Maintenance Scope / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., Main Sewer Conduit Relining & Road Relay"
                value={maintenanceForm.title}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Infrastructure Sector</label>
                <select
                  value={maintenanceForm.category}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="roads">Roads & Pavement</option>
                  <option value="water">Water Works</option>
                  <option value="sewage">Sewage & Sanitation</option>
                  <option value="drainage">Storm Drainage</option>
                  <option value="electricity">Electricity Board</option>
                  <option value="telecom">Telecom & Fiber</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Traffic Impact Severity</label>
                <select
                  value={maintenanceForm.severity}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, severity: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="Major">Major (Total Road Closure)</option>
                  <option value="Moderate">Moderate (Lane Diversion)</option>
                  <option value="Minor">Minor (Verge Only)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Maintenance Category</label>
              <select
                value={maintenanceForm.maintenance_type}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                <option value="Scheduled Dig-Once Overhaul">Scheduled Dig-Once Overhaul</option>
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Emergency Utility Repair">Emergency Utility Repair</option>
                <option value="Resurfacing & Bitumen Laying">Resurfacing & Bitumen Laying</option>
              </select>
            </div>

            {/* Timeframe */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Commencement Date</label>
                <input
                  type="date"
                  value={maintenanceForm.start_date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, start_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Completion</label>
                <input
                  type="date"
                  value={maintenanceForm.expected_end_date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, expected_end_date: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sanctioned Outlay Budget (₹)</label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  value={maintenanceForm.sanctioned_budget}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, sanctioned_budget: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ₹{(Number(maintenanceForm.sanctioned_budget) / 100000).toFixed(2)} Lakhs
              </span>
            </div>

            {/* Ward & Address */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ward Zone</label>
                <input
                  type="text"
                  value={maintenanceForm.ward}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, ward: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Landmark</label>
                <input
                  type="text"
                  value={maintenanceForm.address}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, address: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Contractor */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Contractor</label>
              <select
                value={maintenanceForm.contractor_name}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, contractor_name: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="L&T Infrastructure Division">L&T Infrastructure Division</option>
                <option value="Afcons Infrastructure Ltd">Afcons Infrastructure Ltd</option>
                <option value="Shapoorji Pallonji Urban">Shapoorji Pallonji Urban</option>
                <option value="Municipal In-House Engineering Crew">Municipal In-House Engineering Crew</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingMaintenance}
                className="w-full bg-civic-700 hover:bg-civic-800 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <HardHat className="w-4 h-4" />
                <span>{submittingMaintenance ? 'Sanctioning...' : 'Sanction Maintenance Work'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
