import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Radio, ShieldAlert, Clock, RefreshCw, UserCheck } from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveSessions();
    const timer = setInterval(loadLiveSessions, 5000); // Live poll every 5s
    return () => clearInterval(timer);
  }, []);

  const loadLiveSessions = async () => {
    try {
      const data = await api.getLiveQuizSessions();
      setActiveSessions(data);
    } catch (err) {
      console.error('Failed loading live sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-rose-600 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900">Live Quiz Session Monitor</h1>
          </div>
          <p className="text-xs text-slate-500">Real-time status of active student exam attempts and integrity indicators</p>
        </div>

        <button
          onClick={loadLiveSessions}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Quiz Title</th>
                <th className="px-4 py-3 text-center">Progress</th>
                <th className="px-4 py-3 text-center">Focus Loss Count</th>
                <th className="px-4 py-3 text-center">Risk Level</th>
                <th className="px-4 py-3">Time Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading active live sessions...
                  </td>
                </tr>
              ) : activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No active student quiz sessions currently running.
                  </td>
                </tr>
              ) : (
                activeSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.studentName}</td>
                    <td className="px-4 py-3 text-slate-800">{s.quizTitle}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600">
                      {s.answeredCount} / {s.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {s.focusLostCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                        s.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 60000))} mins
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
