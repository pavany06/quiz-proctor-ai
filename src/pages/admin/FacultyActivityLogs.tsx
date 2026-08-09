import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { FacultyActivityLog } from '../../types';
import { History, Search, Filter, Clock, User } from 'lucide-react';

export const FacultyActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<FacultyActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed loading faculty logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.quizTitle && l.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Faculty Activity Monitoring Logs</h1>
        <p className="text-xs text-slate-500">Real-time audit trail of all faculty quiz creations, AI generation, and settings modifications</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter by faculty, action, or quiz title..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Faculty Member</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Quiz Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading activity logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{log.facultyName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{log.description}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{log.quizTitle || 'N/A'}</td>
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
