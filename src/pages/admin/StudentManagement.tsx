import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { Search, UserCheck, Award, Calendar } from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentsList();
      setStudents(data);
    } catch (err) {
      console.error('Failed loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Management Oversight</h1>
        <p className="text-xs text-slate-500">Monitor registered student profiles and academic attempt activity</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by student name or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3 text-center">Quizzes Attempted</th>
                <th className="px-4 py-3 text-center">Average Score</th>
                <th className="px-4 py-3">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading student data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No registered students found. Students register themselves when joining assessments.
                  </td>
                </tr>
              ) : (
                filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{s.email}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600">
                      {s.quizzesAttemptedCount || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">
                      {s.averageScore || 0}%
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
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
