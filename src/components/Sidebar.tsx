import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  HelpCircle,
  BrainCircuit,
  BarChart3,
  History,
  ShieldAlert,
  Bell,
  Settings,
  PlusCircle,
  FileSpreadsheet,
  Bot,
  Radio,
  Share2,
  Lock,
  User,
  ListChecks,
  CheckSquare,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'firebase-cloud', label: 'Firebase Cloud & JSON Dump', icon: Cloud },
    { id: 'faculty-management', label: 'Faculty Management', icon: Users },
    { id: 'student-management', label: 'Student Management', icon: UserCheck },
    { id: 'practice-quizzes', label: 'Practice Quizzes (Admin)', icon: BookOpen },
    { id: 'quiz-management', label: 'Published Quiz Control', icon: ListChecks },
    { id: 'ai-ml-analytics', label: 'AI & ML Analytics', icon: BrainCircuit },
    { id: 'faculty-activity-logs', label: 'Faculty Activity Logs', icon: History },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldAlert }
  ];

  const facultyNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-quizzes', label: 'My Quizzes & Assessments', icon: ListChecks },
    { id: 'create-quiz', label: 'Create New Quiz', icon: PlusCircle },
    { id: 'participants', label: 'Student Participants', icon: Users },
    { id: 'live-sessions', label: 'Live Quiz Sessions', icon: Radio },
    { id: 'results', label: 'Quiz Results & AI Insights', icon: BarChart3 },
    { id: 'exam-integrity', label: 'Anti-Cheating Integrity Logs', icon: Lock }
  ];

  const navItems = user.role === 'ADMIN' ? adminNav : facultyNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-3">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {user.role === 'ADMIN' ? 'Administrator Navigation' : 'Faculty Workstation'}
          </div>

          <nav className="mt-1 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Logged in as</div>
            <div className="mt-0.5 text-xs font-bold text-slate-800 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
      </aside>
    </>
  );
};
