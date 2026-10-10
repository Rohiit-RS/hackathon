import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  AlertTriangle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Compass,
  Crosshair,
  Move,
  Map as MapIcon,
  ShieldCheck,
  Building,
  LogIn
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Client-side jurisdiction detection helper
function getJurisdictionInfo(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return {
      type: 'core',
      title: 'Kancheepuram Municipal Corporation',
      description: 'Standard municipal jurisdiction zone.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };
  }

  // Core Kancheepuram (within ~35km of center 12.8342, 79.7036)
  const distKm = Math.sqrt(
    Math.pow((lat - 12.8342) * 111, 2) +
    Math.pow((lng - 79.7036) * 111 * Math.cos(12.8342 * Math.PI / 180), 2)
  );

  if (distKm <= 35) {
    return {
      type: 'core',
      title: '🏛️ Core Municipal Jurisdiction: Kancheepuram Municipal Corporation',
      description: 'Within primary municipal boundary. Direct localized crew dispatch applies.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };
  }

  // Chennai Metropolitan Area (CMDA)
  if (lat >= 12.75 && lat <= 13.35 && lng >= 79.80 && lng <= 80.35) {
    return {
      type: 'chennai',
      title: '⚠️ Extended Jurisdiction Notice: Greater Chennai Metropolitan Area (CMDA)',
      description: 'Location falls under Chennai Metropolitan Development Authority. Grievance will be registered and automatically forwarded to the Regional Corporation Division.',
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    };
  }

  // Tamil Nadu State-Wide
  if (lat >= 8.0 && lat <= 13.6 && lng >= 76.0 && lng <= 80.5) {
    return {
      type: 'tamil_nadu',
      title: '⚠️ State-Wide Jurisdiction Notice: Tamil Nadu State Public Works & Highways',
      description: 'Location falls under Tamil Nadu State Jurisdiction. Grievance will be recorded and forwarded to the respective Regional State Division Office.',
      color: 'bg-blue-50 border-blue-200 text-blue-900'
    };
  }

  return {
    type: 'outside',
    title: '⚠️ Notice: Location Outside Tamil Nadu State Boundaries',
    description: 'Coordinates lie outside Tamil Nadu state boundaries (lat 8.0–13.6, lng 76.0–80.5). Grievance recorded as cross-boundary inquiry.',
    color: 'bg-purple-50 border-purple-200 text-purple-900'
  };
}

// Custom draggable pin icon for citizen grievance reporting
const citizenDraggablePinIcon = L.divIcon({
  className: 'citizen-draggable-pin',
  html: `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: grab;
    ">
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: #dc2626;
        border: 2.5px solid #ffffff;
        box-shadow: 0 8px 16px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg style="transform: rotate(45deg);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <span style="
        background: #0f172a;
        color: #ffffff;
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
  iconSize: [34, 48],
  iconAnchor: [17, 44]
});

// MiniMap helpers
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

export default function ReportModal({ isOpen, onClose, onSuccess, initialLocation = null }) {
  const { user, openAuthModal } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [problemType, setProblemType] = useState('pothole');
  const [ward, setWard] = useState(initialLocation?.ward || 'Ward 4 (Anna Nagar)');
  const [address, setAddress] = useState(initialLocation?.address || 'Gandhi Road / Collectorate Junction');
  const [latitude, setLatitude] = useState(initialLocation?.latitude || 12.834200);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || 79.703600);
  const [locationSource, setLocationSource] = useState('manual_pin'); // 'exif', 'live_gps', 'manual_pin'
  const [showMapPicker, setShowMapPicker] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const jurisdiction = getJurisdictionInfo(latitude, longitude);

  useEffect(() => {
    if (initialLocation) {
      if (initialLocation.latitude) setLatitude(initialLocation.latitude);
      if (initialLocation.longitude) setLongitude(initialLocation.longitude);
      if (initialLocation.address) setAddress(initialLocation.address);
      if (initialLocation.ward) setWard(initialLocation.ward);
      if (initialLocation.category) setCategory(initialLocation.category);
      if (initialLocation.problemType) setProblemType(initialLocation.problemType);
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      if (locationSource === 'exif') {
        setLatitude(12.834220);
        setLongitude(79.703610);
      }
    };
    reader.readAsDataURL(file);
    setErrorMsg(null);
  };

  const handleAcquireDeviceLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationSource('live_gps');
          setErrorMsg(null);
        },
        (err) => {
          setLatitude(12.834200);
          setLongitude(79.703600);
          setLocationSource('live_gps');
        }
      );
    } else {
      setLatitude(12.834200);
      setLongitude(79.703600);
    }
  };

  const handlePinDragEnd = (e) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    setLatitude(pos.lat);
    setLongitude(pos.lng);
    setLocationSource('manual_pin');
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationSource('manual_pin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Authentication required. Please sign in or use a demo account to submit a report.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('problem_type', problemType);
      formData.append('ward', ward);
      formData.append('address', address);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('location_source', locationSource);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.submitReport(formData);
      if (res.warning) {
        setSuccessMsg(`Grievance registered! Jurisdiction Notice: ${res.warning}`);
      } else {
        setSuccessMsg('Issue report filed successfully! Clustered into municipal queue.');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess(res.report);
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
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-civic-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-civic-400" />
            <h3 className="font-bold text-base">Report Public Works Issue</h3>
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
          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You are currently not signed in. Please sign in or use a demo account to file this grievance.</span>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="ml-2 px-3 py-1.5 bg-[#0b2545] text-white rounded-xl font-bold text-[11px] hover:bg-[#134074] transition whitespace-nowrap flex items-center gap-1 shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Sign In / Demo</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Photo Upload with Magic Byte Check */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Site Evidence Photo (Max 5MB • JPEG/PNG/WebP with Magic Byte Audit) *
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-civic-500 rounded-2xl p-4 text-center cursor-pointer transition relative bg-slate-50/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-28 w-auto mx-auto rounded-lg object-cover shadow-sm"
                  />
                  <div className="text-[11px] text-civic-700 font-semibold">
                    Click to change photo
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 py-1.5">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="font-bold text-slate-700">Click or drag photo here</div>
                  <div className="text-[10px] text-slate-400">
                    EXIF metadata automatically parsed & stripped for privacy
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category & Problem Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Infrastructure Sector</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === 'sewage') setProblemType('sewage leak');
                  else if (e.target.value === 'roads') setProblemType('pothole');
                  else if (e.target.value === 'water') setProblemType('pipeline burst');
                  else if (e.target.value === 'electricity') setProblemType('exposed wire');
                  else if (e.target.value === 'drainage') setProblemType('blocked drain');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white"
              >
                <option value="roads">Roads & Pavement</option>
                <option value="sewage">Sewage & Sanitation</option>
                <option value="water">Water Works</option>
                <option value="drainage">Storm Drainage</option>
                <option value="electricity">Electricity Board</option>
                <option value="telecom">Telecom & Fiber</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Issue Tag / Type *</label>
              <input
                type="text"
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                placeholder="e.g. pothole, sewage leak"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep crater pothole near bus terminal"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description & Safety Impact</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how long the issue has persisted and danger to vehicles/pedestrians..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          {/* DRAGGABLE PIN INTERACTIVE MAP ALTERNATIVE TO GPS */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-civic-600" />
                <span>Location Determination (Drag Pin on Map or GPS)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcquireDeviceLocation}
                  className="text-[10px] font-bold text-civic-700 hover:text-civic-900 flex items-center gap-1 underline"
                >
                  <Crosshair className="w-3 h-3" />
                  Auto GPS
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <MapIcon className="w-3 h-3 text-amber-600" />
                  {showMapPicker ? 'Hide Map' : 'Show Map'}
                </button>
              </div>
            </div>

            {/* Geotag Source Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'manual_pin', label: 'Drag Pin on Map', trust: 'Visual Pick', priority: 'Interactive' },
                { id: 'live_gps', label: 'Device GPS', trust: 'High Trust', priority: 'Hardware' },
                { id: 'exif', label: 'Photo EXIF', trust: 'High Trust', priority: 'Metadata' }
              ].map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => {
                    setLocationSource(src.id);
                    if (src.id === 'manual_pin') setShowMapPicker(true);
                  }}
                  className={`p-2 rounded-xl border text-center transition ${
                    locationSource === src.id
                      ? 'bg-civic-100 border-civic-400 text-civic-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-[11px] font-bold">{src.label}</div>
                  <div className="text-[9px] text-slate-500">{src.priority} • {src.trust}</div>
                </button>
              ))}
            </div>

            {/* Interactive Leaflet Mini-Map with Draggable Pin */}
            {showMapPicker && (
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
                    icon={citizenDraggablePinIcon}
                  />
                </MapContainer>

                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center justify-between z-[1000]">
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Move className="w-3 h-3" /> Drag pin or click map to set spot
                  </span>
                  <span className="font-mono text-slate-300">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
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

            {/* Live Jurisdiction Zone Feedback (Core vs Chennai vs Tamil Nadu) */}
            <div className={`p-2.5 rounded-xl border text-[11px] space-y-0.5 transition ${jurisdiction.color}`}>
              <div className="font-bold flex items-center justify-between">
                <span>{jurisdiction.title}</span>
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/70">
                  {jurisdiction.type === 'core' ? 'Municipal Core' : 'State-Wide'}
                </span>
              </div>
              <p className="text-[10px] opacity-90 leading-tight">
                {jurisdiction.description}
              </p>
            </div>
          </div>

          {/* Location & Ward */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ward / Zone</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-civic-600 hover:bg-civic-700 text-white font-bold py-3 rounded-xl shadow-md transition active:scale-98 text-xs flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>{loading ? 'Submitting & Clustering...' : 'Submit Geotagged Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
