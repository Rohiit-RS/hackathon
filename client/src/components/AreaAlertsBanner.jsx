import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  X,
  Megaphone,
  MapPin,
  ShieldAlert,
  Bell,
  PlusCircle,
  Phone,
  Compass,
  Calendar,
  CheckCircle2,
  HardHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AreaAlertsBanner({ alerts = [], onRefreshAlerts }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Modal states
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Subscribe form state
  const [subWard, setSubWard] = useState('Ward 4');
  const [commuteRoute, setCommuteRoute] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Publish form state
  const [publishForm, setPublishForm] = useState({
    title: '',
    ward: 'Ward 4',
    category: 'roads',
    severity: 'Moderate',
    message: '',
    affected_roads: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    who_is_digging: user?.department || 'Highways & Pavement Division',
    why: '',
    alternative_routes: '',
    contact_details: 'Field Engineer: Er. K. Raman (9444012345)'
  });
  const [publishing, setPublishing] = useState(false);

  const canPublish = user?.role === 'department_officer' || user?.role === 'admin';

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingSub(true);
      const res = await api.subscribeAlerts({
        ward: subWard,
        commuteRoute: commuteRoute.trim()
      });
      setActionStatus({ type: 'success', text: res.message || `Subscribed to ${subWard} 48-hour dig advisories!` });
      setTimeout(() => setShowSubscribeModal(false), 1400);
    } catch (err) {
      setActionStatus({ type: 'error', text: err.message || 'Failed to subscribe to alerts' });
    } finally {
      setSubmittingSub(false);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!publishForm.title || !publishForm.message || !publishForm.ward) {
      setActionStatus({ type: 'error', text: 'Title, message, and ward are required' });
      return;
    }

    try {
      setPublishing(true);
      setActionStatus(null);
      await api.createAlert({
        ...publishForm,
        affected_roads: publishForm.affected_roads
          ? publishForm.affected_roads.split(',').map((r) => r.trim()).filter(Boolean)
          : ['Local Area Roads']
      });
      setActionStatus({ type: 'success', text: 'Advisory notice broadcasted to residents!' });
      if (onRefreshAlerts) await onRefreshAlerts();
      setTimeout(() => {
        setShowPublishModal(false);
        setActionStatus(null);
      }, 1200);
    } catch (err) {
      setActionStatus({ type: 'error', text: err.message || 'Failed to broadcast alert' });
    } finally {
      setPublishing(false);
    }
  };

  if (dismissed && !showSubscribeModal && !showPublishModal) return null;

  const activeAlert = alerts[0];

  return (
    <>
      {!dismissed && alerts.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-300 text-amber-950 transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1 rounded-md bg-amber-400 text-amber-950 shrink-0">
                  <Megaphone className="w-3.5 h-3.5" />
                </span>
                <div className="text-xs truncate">
                  <span className="font-extrabold uppercase tracking-wider text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded mr-1.5 font-mono">
                    Gazette Public Notice
                  </span>
                  <strong className="font-bold text-amber-950">{activeAlert.title}:</strong>{' '}
                  <span className="text-amber-900 hidden md:inline">{activeAlert.message}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => {
                    setActionStatus(null);
                    setShowSubscribeModal(true);
                  }}
                  className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                  title="Subscribe to your ward or commute route"
                >
                  <Bell className="w-3 h-3 text-amber-800" />
                  <span>Subscribe</span>
                </button>

                {canPublish && (
                  <button
                    onClick={() => {
                      setActionStatus(null);
                      setShowPublishModal(true);
                    }}
                    className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Post Notice</span>
                  </button>
                )}

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-0.5"
                >
                  <span>{expanded ? 'Collapse Notices' : `All Advisories (${alerts.length})`}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 hover:bg-amber-200/80 rounded text-amber-800"
                  title="Acknowledge advisory notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Advisories */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-amber-300/80 grid sm:grid-cols-2 gap-3 pb-1 animate-fade-in">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white/95 border border-amber-200 rounded-2xl p-4 text-xs text-slate-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{alert.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {alert.ward}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        alert.severity === 'Major'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity} Impact
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">{alert.message}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Digging Authority</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <HardHat className="w-3 h-3 text-civic-600" />
                          {alert.who_is_digging || alert.category || 'Public Works'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Excavation Dates</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          {alert.start_date} to {alert.end_date}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Detour & Alternative Routes</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Compass className="w-3 h-3 text-emerald-600 shrink-0" />
                          {alert.alternative_routes || 'Signposted via secondary parallel road'}
                        </span>
                      </div>
                      <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">
                          Affected Corridors: <strong>{(alert.affected_roads || []).join(', ')}</strong>
                        </span>
                        <span className="text-civic-700 font-bold text-[10px] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {alert.contact_details || 'Helpline: 1800-425-1234'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIBE MODAL */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">Subscribe to 48-Hour Dig Alerts</h3>
              </div>
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Receive advance notifications 48 hours before any utility excavation begins on your home ward or regular commute route.
            </p>

            {actionStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                actionStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {actionStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{actionStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleSubscribeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Home / Primary Ward *</label>
                <select
                  value={subWard}
                  onChange={(e) => setSubWard(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white"
                >
                  <option value="Ward 1">Ward 1 (Central Commercial District)</option>
                  <option value="Ward 2">Ward 2 (Kamarajar Nagar)</option>
                  <option value="Ward 3">Ward 3 (Ennaikaran / Market)</option>
                  <option value="Ward 4">Ward 4 (Gandhi Road / Collectorate)</option>
                  <option value="Ward 5">Ward 5 (Pillaiyarpalayam)</option>
                  <option value="Ward 6">Ward 6 (Orikkai Heritage Corridor)</option>
                  <option value="Ward 7">Ward 7 (Railway Border)</option>
                  <option value="Ward 8">Ward 8 (Industrial Belt)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commute Route or Key Streets (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Gandhi Road to Kancheepuram Bus Terminal"
                  value={commuteRoute}
                  onChange={(e) => setCommuteRoute(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  You will receive SMS and portal push notifications before digging begins along this path.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubscribeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSub}
                  className="bg-civic-700 hover:bg-civic-800 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{submittingSub ? 'Subscribing...' : 'Confirm Subscription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH ADVISORY MODAL (OFFICER & ADMIN ONLY) */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-civic-700" />
                <h3 className="font-black text-slate-900 text-base">Broadcast Public Dig Advisory Notice</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Notifies ward residents 48 hours prior to utility cuts, publishing alternative detour routes and field engineer hotline details.
            </p>

            {actionStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                actionStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {actionStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{actionStatus.text}</span>
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="space-y-3 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Advisory Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Underground Storm Drain Trenching Notice"
                    value={publishForm.title}
                    onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affected Ward *</label>
                  <select
                    value={publishForm.ward}
                    onChange={(e) => setPublishForm({ ...publishForm, ward: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Ward 1">Ward 1</option>
                    <option value="Ward 2">Ward 2</option>
                    <option value="Ward 3">Ward 3</option>
                    <option value="Ward 4">Ward 4</option>
                    <option value="Ward 5">Ward 5</option>
                    <option value="Ward 6">Ward 6</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Impact Severity *</label>
                  <select
                    value={publishForm.severity}
                    onChange={(e) => setPublishForm({ ...publishForm, severity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  >
                    <option value="Major">Major (Total Road Closure)</option>
                    <option value="Moderate">Moderate (Single Lane Diverted)</option>
                    <option value="Minor">Minor (Verge / Sidewalk Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Excavation Start Date</label>
                  <input
                    type="date"
                    value={publishForm.start_date}
                    onChange={(e) => setPublishForm({ ...publishForm, start_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Restoration Date</label>
                  <input
                    type="date"
                    value={publishForm.end_date}
                    onChange={(e) => setPublishForm({ ...publishForm, end_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Advisory Notice & Purpose *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief notice explaining the public works being carried out..."
                    value={publishForm.message}
                    onChange={(e) => setPublishForm({ ...publishForm, message: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Affected Roads (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Gandhi Road, Collectorate Cross Road"
                    value={publishForm.affected_roads}
                    onChange={(e) => setPublishForm({ ...publishForm, affected_roads: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Recommended Detour / Alternative Routes</label>
                  <input
                    type="text"
                    placeholder="e.g., Light vehicles take Kamarajar Link; Heavy vehicles via Bypass"
                    value={publishForm.alternative_routes}
                    onChange={(e) => setPublishForm({ ...publishForm, alternative_routes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Field Engineer Hotline Contact</label>
                  <input
                    type="text"
                    placeholder="e.g., Er. K. Raman (EE Roads) - 9444012345"
                    value={publishForm.contact_details}
                    onChange={(e) => setPublishForm({ ...publishForm, contact_details: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="bg-civic-700 hover:bg-civic-800 text-white px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Broadcasting...' : 'Broadcast Advisory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
