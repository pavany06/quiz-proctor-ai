import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ListChecks,
  CheckCircle2,
  FileEdit,
  HelpCircle,
  Award,
  Radio,
  TrendingUp,
  PlusCircle,
  Share2
} from 'lucide-react';

interface FacultyDashboardProps {
  onNavigate: (tab: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const s = await api.getFacultyDashboardStats(user.id);
      const q = await api.getFacultyQuizzes(user.id);
      setStats(s);
      setQuizzes(q);
    } catch (err) {
      console.error('Failed loading faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'My Quizzes', value: stats?.totalQuizzes || 0, icon: ListChecks, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Published', value: stats?.publishedQuizzes || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Drafts', value: stats?.draftQuizzes || 0, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Total Questions', value: stats?.totalQuestions || 0, icon: HelpCircle, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
    { label: 'Student Attempts', value: stats?.totalAttempts || 0, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { label: 'Active Sessions', value: stats?.activeSessions || 0, icon: Radio, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    { label: 'Average Score', value: `${stats?.avgScore || 0}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
    { label: 'Overall Pass Rate', value: `${stats?.passRate || 0}%`, icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-500">Faculty Workstation & Assessment Management Center</p>
        </div>
        <button
          onClick={() => onNavigate('create-quiz')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
        >
          <PlusCircle className="h-4 w-4" /> Create New Quiz
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`flex items-center gap-4 rounded-xl border p-4 shadow-2xs ${c.bg}`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-2xs ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
                <div className="text-xs font-semibold text-slate-600">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Quizzes List */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Quizzes Created</h3>
          <button
            onClick={() => onNavigate('my-quizzes')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            View All ({quizzes.length})
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No quizzes created yet. Click "Create New Quiz" to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quizzes.slice(0, 5).map(q => (
              <div key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{q.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      q.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
                    Topic: {q.topic} &bull; Secret Code: <strong className="text-indigo-700">{q.secretCode}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('my-quizzes')}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
