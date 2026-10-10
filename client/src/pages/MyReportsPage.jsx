import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
  MapPin,
  AlertCircle,
  ThumbsUp,
  Camera
} from 'lucide-react';

export default function MyReportsPage({ onOpenReportModal }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getMyReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  const handleConfirmResolution = async (repId) => {
    try {
      const res = await api.confirmReportResolution(repId);
      setFeedback({ type: 'success', text: res.message });
      await loadReports();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-civic-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-civic-500/30 text-civic-200 px-3 py-1 rounded-full border border-civic-400/30">
            Citizen Grievance Lifecycle
          </span>
          <h1 className="text-2xl font-black mt-2">
            My Submitted Civic Issue Reports
          </h1>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            Follow up on your submitted complaints, read official replies from engineers, and confirm whether repairs were truly completed to close the accountability loop.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="bg-civic-600 hover:bg-civic-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-civic-600/30 transition active:scale-95 whitespace-nowrap flex items-center gap-1.5"
        >
          <Camera className="w-4 h-4" />
          <span>File New Issue Report</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading your reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-700">No Complaints Submitted Yet</h3>
            <p className="max-w-md mx-auto text-slate-500">
              Notice a pothole, open sewage, or broken street cable in your neighborhood? Submit a geotagged photo to have it automatically clustered and sequenced.
            </p>
            <button
              onClick={onOpenReportModal}
              className="mt-2 bg-civic-600 hover:bg-civic-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Report an Issue Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{rep.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-bold">
                        {rep.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rep.address} ({rep.ward})</span>
                      <span>•</span>
                      <span>Filed: {new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                    rep.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rep.status === 'in_progress'
                      ? 'bg-civic-100 text-civic-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rep.status === 'resolved' ? 'Resolved' : rep.status === 'in_progress' ? 'In Progress' : 'Submitted'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-4 gap-4 items-center">
                  {rep.photo_url && (
                    <img
                      src={rep.photo_url}
                      alt="Uploaded proof"
                      className="h-28 w-full sm:w-28 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="sm:col-span-3 space-y-2 text-xs text-slate-600">
                    <p>{rep.description}</p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Location Source: <strong>{rep.location_source}</strong> • Verified: {rep.location_verified ? 'Yes' : 'Flagged unverified'}
                    </div>

                    {/* Official Department Response */}
                    {rep.department_reply ? (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-1">
                        <div className="font-bold text-civic-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-civic-600" />
                          <span>Official Municipal Reply:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700">
                          "{rep.department_reply}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Awaiting engineering division inspection and coordination dispatch...
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Resolution Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {rep.citizen_confirmed_resolved
                      ? '✅ Resolution confirmed by resident.'
                      : 'Has the work been completed satisfactorily?'}
                  </span>

                  {!rep.citizen_confirmed_resolved && (
                    <button
                      onClick={() => handleConfirmResolution(rep.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1 active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Confirm Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
