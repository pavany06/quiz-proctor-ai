import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { IntegrityEvent } from '../../types';
import { ShieldAlert, AlertTriangle, Lock, EyeOff, Maximize2, WifiOff } from 'lucide-react';

export const ExamIntegrityView: React.FC = () => {
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getIntegrityEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed loading integrity events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'FOCUS_LOST':
        return <EyeOff className="h-4 w-4 text-amber-600" />;
      case 'FULLSCREEN_EXIT':
        return <Maximize2 className="h-4 w-4 text-rose-600" />;
      case 'DISCONNECT':
        return <WifiOff className="h-4 w-4 text-slate-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Exam Integrity & Anti-Cheating Monitoring</h1>
        </div>
        <p className="text-xs text-slate-500">Automated focus loss detection, tab switching logs, and fullscreen exit violations</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Quiz Title</th>
                <th className="px-4 py-3">Violation Event</th>
                <th className="px-4 py-3">Details / Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading exam integrity records...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No integrity violation events recorded.
                  </td>
                </tr>
              ) : (
                events.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{e.studentName}</td>
                    <td className="px-4 py-3 text-slate-800">{e.quizTitle}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                        {getEventIcon(e.eventType)}
                        {e.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.details} {e.durationSeconds ? `(${e.durationSeconds}s)` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
