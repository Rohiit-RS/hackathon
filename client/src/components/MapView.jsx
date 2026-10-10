import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  Map as MapIcon,
  ShieldAlert
} from 'lucide-react';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Category SVG Icons
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
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
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
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
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

export default function MapView({
  projects = [],
  reports = [],
  selectedProject = null,
  onSelectProject,
  onVerifyProject,
  showReports = false
}) {
  const defaultCenter = [12.8342, 79.7036];
  const center = selectedProject
    ? [selectedProject.latitude, selectedProject.longitude]
    : defaultCenter;

  const [tileMode, setTileMode] = useState('street'); // 'street' or 'light'

  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100">
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

        {/* Project Markers */}
        {projects.map((project) => {
          if (!project.latitude || !project.longitude) return null;
          const icon = createEnterpriseMarker(project.category, project.status);

          return (
            <Marker
              key={project.id}
              position={[project.latitude, project.longitude]}
              icon={icon}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[260px] max-w-[300px]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                      {project.department_name}
                    </span>
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

                  <h4 className="font-extrabold text-slate-900 text-xs mb-1 line-clamp-2 leading-snug">
                    {project.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2">
                    {project.address} ({project.ward})
                  </p>

                  <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-200/60 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Outlay:</span>
                      <span className="font-bold text-slate-900">
                        ₹{(project.sanctioned_budget / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expenditure Booked:</span>
                      <span className="font-bold text-civic-800">
                        ₹{(project.amount_spent / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Executing Contractor:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]">
                        {project.contractor_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onSelectProject(project)}
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

        {/* Citizen Complaints Markers */}
        {showReports && reports.map((report) => {
          if (!report.latitude || !report.longitude) return null;
          const reportIcon = L.divIcon({
            className: 'report-pin',
            html: `
              <div style="
                background-color: #ef4444;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 11px;
                font-weight: bold;
              ">!</div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={reportIcon}
            >
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-mono">
                    Citizen Grievance
                  </span>
                  <div className="font-bold text-xs mt-1 text-slate-900">{report.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{report.description}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Control: Layer Switcher Top-Right */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-semibold text-slate-700">
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

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/90 text-[11px] space-y-1.5 hidden sm:block">
        <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
          Statutory Utility Tier Hierarchy
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-purple-600"></span>
            <span>Sewage (Tier 1 Deep)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-cyan-600"></span>
            <span>Water Mains (Tier 1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-blue-600"></span>
            <span>Storm Drains (Tier 2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-amber-600"></span>
            <span>Power & Telecom (Tier 3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-orange-600"></span>
            <span>Road Pavement (Tier 4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-red-600"></span>
            <span>Disputed Inspection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
