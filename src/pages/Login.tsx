import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserPlus, LogIn, Key, Mail, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';

interface LoginProps {
  onJoinDirectByCode?: (code: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onJoinDirectByCode }) => {
  const { login, registerStudent, loginDirect } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'JOIN_CODE'>('LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [quizCode, setQuizCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validatedQuiz, setValidatedQuiz] = useState<any | null>(null);

  const handleQuickLogin = async (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    setLoading(true);
    setError(null);
    try {
      await loginDirect(role);
    } catch (err: any) {
      setError(err.message || 'Direct login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both Email/User ID and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields to register.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerStudent(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCode) {
      setError('Please enter a secret quiz code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const code = quizCode.trim().toUpperCase();
      const res = await fetch(`/api/quizzes/code/${code}`);
      if (!res.ok) {
        throw new Error('Invalid secret quiz code. Please verify the code with your course faculty.');
      }
      const quiz = await res.json();
      setValidatedQuiz(quiz);
      if (onJoinDirectByCode) {
        onJoinDirectByCode(code);
      }
      // Redirect to student registration / login mode with prefilled code context
      setMode('REGISTER');
    } catch (err: any) {
      setError(err.message || 'Quiz code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-2xl font-black text-white shadow-lg">
            Q
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white uppercase">
            QUIZ PROCTOR AI
          </h2>
          <p className="mt-1 text-xs text-indigo-300 font-medium">
            AI-Powered Proctored Assessment & Examination Platform
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-8 flex rounded-xl border border-slate-800 bg-slate-950/80 p-1 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'LOGIN' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'REGISTER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Student Register
          </button>
          <button
            type="button"
            onClick={() => { setMode('JOIN_CODE'); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              mode === 'JOIN_CODE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Join via Code
          </button>
        </div>

        {/* Validated Quiz Context Banner */}
        {validatedQuiz && (
          <div className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-950/60 p-3.5 text-xs space-y-1.5 shadow-md">
            <div className="flex items-center gap-2 font-bold text-indigo-200">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Assessment Ready: {validatedQuiz.title}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Code: <span className="font-mono font-bold text-white uppercase">{validatedQuiz.secretCode}</span> &bull; Topic: {validatedQuiz.topic}
            </p>
            <div className="text-[11px] text-amber-300 font-medium">
              Please log in or create your student account below to start this exam directly.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-xs font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Box */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">User ID / Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email or User ID"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? 'Authenticating...' : 'Login to System'}
              </button>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Student Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? 'Registering Account...' : 'Create Student Account'}
              </button>
            </form>
          )}

          {mode === 'JOIN_CODE' && (
            <div className="space-y-4">
              <form onSubmit={handleJoinCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Secret Quiz Code</label>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Enter the unique secret code provided by your faculty (e.g. DSA7K29X)
                  </p>
                  <div className="relative mt-2">
                    <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
                    <input
                      type="text"
                      value={quizCode}
                      onChange={e => { setQuizCode(e.target.value.toUpperCase()); setValidatedQuiz(null); }}
                      placeholder="e.g. DSA7K29X"
                      className="w-full uppercase font-mono tracking-wider rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 transition"
                >
                  {loading ? 'Verifying Code...' : 'Verify Secret Code & Register/Login'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Quick Direct Access Links (Direct Bypass) */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ⚡ Quick Direct Access (No Auth Required)
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Click any role below to enter directly into the system:
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('STUDENT')}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500/60 active:scale-95 transition shadow-xs"
            >
              <span className="text-base">🎓</span>
              <span>Student</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('FACULTY')}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-950/30 p-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/50 hover:border-blue-500/60 active:scale-95 transition shadow-xs"
            >
              <span className="text-base">👨‍🏫</span>
              <span>Faculty</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('ADMIN')}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-500/30 bg-purple-950/30 p-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 hover:border-purple-500/60 active:scale-95 transition shadow-xs"
            >
              <span className="text-base">🛡️</span>
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
