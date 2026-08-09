import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, GraduationCap, UserCheck, Bell, Menu, X } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
            <Shield className="h-3 w-3" /> ADMIN
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
            <GraduationCap className="h-3 w-3" /> FACULTY
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <UserCheck className="h-3 w-3" /> STUDENT
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-xs backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-sm font-bold text-lg">
            Q
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              QUIZ PROCTOR AI
            </h1>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              AI-Powered Proctored Assessment Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                {getRoleBadge(user.role)}
              </div>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>

            <div className="md:hidden">
              {getRoleBadge(user.role)}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Not logged in</span>
        )}
      </div>
    </header>
  );
};
