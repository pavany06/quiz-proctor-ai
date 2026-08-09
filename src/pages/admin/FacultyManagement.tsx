import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { UserPlus, Search, Key, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Mail, Phone, Building } from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);

  // New Faculty Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyList();
      setFacultyList(data);
    } catch (err: any) {
      setError(err.message || 'Failed loading faculty members.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await api.createFaculty({
        name,
        email,
        employeeId,
        department,
        phone,
        password
      });

      setSuccess(`Faculty member ${name} created successfully.`);
      setShowAddModal(false);

      // Reset form
      setName('');
      setEmail('');
      setEmployeeId('');
      setPhone('');
      setPassword('');

      loadFaculty();
    } catch (err: any) {
      setError(err.message || 'Failed creating faculty.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.toggleFacultyStatus(user.id, nextStatus);
      loadFaculty();
    } catch (err: any) {
      setError(err.message || 'Failed updating status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal || !newPassword) return;

    try {
      await api.resetFacultyPassword(showResetModal.id, newPassword);
      setSuccess(`Password for ${showResetModal.name} reset successfully.`);
      setShowResetModal(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed resetting password.');
    }
  };

  const filteredFaculty = facultyList.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty Management</h1>
          <p className="text-xs text-slate-500">Create, manage, and monitor faculty/teacher accounts</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setError(null); setSuccess(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
        >
          <UserPlus className="h-4 w-4" /> Add Faculty
        </button>
      </div>

      {/* Status Banners */}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by faculty name, email, or employee ID..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      {/* Faculty Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Quizzes Created</th>
                <th className="px-4 py-3 text-center">Students Handled</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading faculty members...
                  </td>
                </tr>
              ) : filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No faculty members found. Click "+ Add Faculty" to register a new teacher.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{f.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{f.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{f.employeeId || 'N/A'}</td>
                    <td className="px-4 py-3">{f.department || 'CSE'}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600">
                      {f.quizzesCreatedCount || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {f.studentsHandledCount || 0}
                    </td>
                    <td className="px-4 py-3">
                      {f.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(f)}
                          className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                            f.status === 'ACTIVE'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {f.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setShowResetModal(f)}
                          className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                        >
                          <Key className="h-3 w-3" /> Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Add Faculty Member</h3>
            <p className="mt-1 text-xs text-slate-500">Register a new faculty account with full quiz creation privileges.</p>

            <form onSubmit={handleCreateFaculty} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Faculty Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@college.edu"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Faculty / Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. FAC-CSE-102"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Phone (Optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Initial Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter temp password"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
                >
                  Create Faculty Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
            <p className="mt-1 text-xs text-slate-500">Reset credentials for {showResetModal.name}</p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
