import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { ShieldAlert, Search, CheckCircle2, XCircle } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l =>
    l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Security & Audit Trail Logs</h1>
        <p className="text-xs text-slate-500">Security event logs, authentication logs, and role authorization records</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter audit logs..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Security Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No security audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{log.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.details || 'N/A'}</td>
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
