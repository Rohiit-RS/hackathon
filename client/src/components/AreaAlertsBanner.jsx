import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, X, Megaphone, MapPin, ShieldAlert } from 'lucide-react';

export default function AreaAlertsBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed || !alerts || alerts.length === 0) return null;

  const activeAlert = alerts[0];

  return (
    <div className="bg-amber-500/10 border-b border-amber-300 text-amber-950 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-md bg-amber-400 text-amber-950 shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs truncate">
              <span className="font-extrabold uppercase tracking-wider text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded mr-1.5 font-mono">
                Gazette Public Notice
              </span>
              <strong className="font-bold text-amber-950">{activeAlert.title}:</strong>{' '}
              <span className="text-amber-900 hidden sm:inline">{activeAlert.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-0.5"
            >
              <span>{expanded ? 'Collapse Notices' : `View All Advisories (${alerts.length})`}</span>
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
          <div className="mt-2.5 pt-2.5 border-t border-amber-300 grid sm:grid-cols-2 gap-2.5 pb-1 animate-fade-in">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white/95 border border-amber-200 rounded-xl p-3 text-xs text-slate-800 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-900">{alert.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono">
                    {alert.severity} Impact
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mb-2">{alert.message}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {alert.ward}
                  </span>
                  <span>Routes: <strong>{alert.affected_roads.join(', ')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
