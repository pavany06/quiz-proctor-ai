import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Users,
  UserCheck,
  BookOpen,
  HelpCircle,
  Award,
  TrendingUp,
  Activity,
  CheckCircle2,
  ListChecks,
  Radio
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.getSystemAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Failed loading system analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 text-xs">
        Loading Admin Overview...
      </div>
    );
  }

  const statCards = [
    { label: 'Total Faculty', value: stats?.totalFaculty || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { label: 'Total Quizzes', value: stats?.totalQuizzes || 0, icon: ListChecks, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Total Questions', value: stats?.totalQuestions || 0, icon: HelpCircle, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
    { label: 'Practice Quizzes', value: stats?.totalPracticeQuizzes || 0, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Total Attempts', value: stats?.totalAttempts || 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Active Sessions', value: stats?.activeQuizSessions || 0, icon: Radio, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    { label: 'Average Score', value: `${stats?.avgScore || 0}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
    { label: 'Overall Pass Rate', value: `${stats?.overallPassRate || 0}%`, icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Administrator Overview</h1>
          <p className="text-xs text-slate-500">Live platform metrics & system health indicators</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          Refresh Analytics
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-xl border p-4 shadow-2xs transition hover:shadow-xs ${card.bg}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-2xs ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{card.value}</div>
                <div className="text-xs font-semibold text-slate-600">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Banner */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Platform Operational Readiness</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              All core assessment subsystems, Machine Learning prediction models, AI question generators, and real-time session integrity monitors are active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
