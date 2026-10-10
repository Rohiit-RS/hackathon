import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  HardHat,
  Calendar,
  IndianRupee,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  GitMerge,
  Move
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const projectDraggablePinIcon = L.divIcon({
  className: 'project-draggable-pin',
  html: `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: grab;
    ">
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: #0f172a;
        border: 2.5px solid #38bdf8;
        box-shadow: 0 8px 16px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #38bdf8;
      ">
        <svg style="transform: rotate(45deg);" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      </div>
      <span style="
        background: #0f172a;
        color: #38bdf8;
        font-size: 8px;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 4px;
        margin-top: 3px;
        font-family: monospace;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        white-space: nowrap;
      ">
        📍 DRAG PIN
      </span>
    </div>
  `,
  iconSize: [36, 50],
  iconAnchor: [18, 46]
});

function MiniMapSync({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MiniMapClickHandler({ onPickLocation }) {
  useMapEvents({
    click: (e) => {
      if (onPickLocation) {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [contractors, setContractors] = useState([]);

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [severity, setSeverity] = useState('Moderate');
  const [departmentId, setDepartmentId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [ward, setWard] = useState('Ward 4 (Anna Nagar)');
  const [address, setAddress] = useState('3rd Main Road, Anna Nagar Junction');
  const [latitude, setLatitude] = useState(12.834240);
  const [longitude, setLongitude] = useState(79.703630);
  const [sanctionedBudget, setSanctionedBudget] = useState(2500000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    async function loadDeptsAndContractors() {
      try {
        const config = await api.getAdminConfig();
        if (config.departments && config.departments.length > 0) {
          setDepartments(config.departments);
          const defaultDept = config.departments.find(d => d.category === category) || config.departments[0];
          setDepartmentId(defaultDept.id);
        }
        if (config.contractors && config.contractors.length > 0) {
          setContractors(config.contractors);
          setContractorId(config.contractors[0].id);
        }
      } catch (err) {
        console.warn('Could not load departments config:', err);
      }
    }
    if (isOpen) {
      loadDeptsAndContractors();
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handlePinDragEnd = (e) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    setLatitude(pos.lat);
    setLongitude(pos.lng);
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      setConflictWarning(null);

      const payload = {
        title,
        purpose,
        description,
        category,
        severity,
        department_id: departmentId,
        contractor_id: contractorId,
        ward,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        sanctioned_budget: parseFloat(sanctionedBudget),
        start_date: startDate,
        expected_end_date: expectedEndDate
      };

      const res = await api.createProject(payload);

      if (res.digOnceConflicts && res.digOnceConflicts.length > 0) {
        setConflictWarning(
          `Notice: Dig-Once Conflict Engine detected ${res.digOnceConflicts.length} nearby excavation project(s). Joint coordination advised!`
        );
      }

      setSuccessMsg('Public Works Project registered successfully into municipal registry!');

      setTimeout(() => {
        if (onSuccess) onSuccess(res.project);
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-[#0b2545] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building className="w-5 h-5 text-civic-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Sanction New Public Works Project</h3>
              <div className="text-[11px] text-slate-300">Statutory Municipal Work Order Registration</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-2 font-medium animate-pulse">
              <GitMerge className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Project Title & Nature of Work *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stormwater Drain Network Expansion & Culvert Rebuild"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
            />
          </div>

          {/* Purpose & Objective */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Statutory Purpose & Public Utility Description
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Prevent seasonal monsoon flooding in residential sectors by linking Ward 4 trunk drain to bypass canal..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          {/* Category, Severity & Department */}
          <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Utility Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white text-xs"
              >
                <option value="roads">Roads & Surface</option>
                <option value="sewage">Sewage (Deep)</option>
                <option value="water">Water Works (Deep)</option>
                <option value="drainage">Storm Drainage</option>
                <option value="electricity">Electricity Board</option>
                <option value="telecom">Telecom & Fiber</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Severity Rating</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white text-xs"
              >
                <option value="Major">Major (High Impact)</option>
                <option value="Moderate">Moderate Priority</option>
                <option value="Minor">Minor Work</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Responsible Dept</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white text-xs truncate"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contractor & Budget */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Executing Contractor</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white text-xs truncate"
              >
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.license_no})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Sanctioned Budget Outlay (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sanctionedBudget}
                  onChange={(e) => setSanctionedBudget(parseFloat(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ₹{(sanctionedBudget / 100000).toFixed(2)} Lakhs
              </span>
            </div>
          </div>

          {/* DRAGGABLE PIN INTERACTIVE MINI-MAP */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-civic-600" />
                <span>Geographic Site Location (Drag Pin on Map)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>

            <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-300 relative isolate shadow-inner">
              <MapContainer
                center={[latitude, longitude]}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <MiniMapSync center={[latitude, longitude]} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MiniMapClickHandler onPickLocation={handleMapClick} />
                <Marker
                  draggable={true}
                  eventHandlers={{ dragend: handlePinDragEnd }}
                  position={[latitude, longitude]}
                  icon={projectDraggablePinIcon}
                />
              </MapContainer>

              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center justify-between z-[1000]">
                <span className="flex items-center gap-1 text-cyan-300 font-bold">
                  <Move className="w-3 h-3" /> Drag pin or click map to reposition
                </span>
                <span className="font-mono text-slate-300">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 font-mono">Latitude:</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-slate-800 bg-white"
                />
              </div>
              <div>
                <span className="text-slate-500 font-mono">Longitude:</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Location & Ward */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ward / Zone *</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-800 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-mono text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected Completion</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-mono text-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0b2545] hover:bg-[#134074] text-white font-bold py-3 rounded-xl shadow-md transition active:scale-98 text-xs flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-civic-300" />
              <span>{loading ? 'Validating Dig-Once Corridor...' : 'Register Project & Scan Dig-Once Conflicts'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
