import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Quiz, PracticeQuiz, Attempt } from '../../types';
import { BookOpen, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, Award, LogIn } from 'lucide-react';

interface StudentPortalProps {
  onStartQuiz: (quiz: Quiz) => void;
  onStartPracticeQuiz: (pQuiz: PracticeQuiz) => void;
  directQuizCode?: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onStartQuiz,
  onStartPracticeQuiz,
  directQuizCode
}) => {
  const { user } = useAuth();
  const [secretCode, setSecretCode] = useState(directQuizCode || '');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [practiceQuizzes, setPracticeQuizzes] = useState<PracticeQuiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setLoadingData(true);
    try {
      const p = await api.getPracticeQuizzes();
      setPracticeQuizzes(p);

      if (user) {
        const att = await api.getStudentAttempts(user.id);
        setAttempts(att);
      }
    } catch (err) {
      console.error('Failed loading student portal data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) return;

    setLoadingCode(true);
    setCodeError(null);

    try {
      const quiz = await api.getQuizByCode(secretCode.trim().toUpperCase());
      onStartQuiz(quiz);
    } catch (err: any) {
      setCodeError(err.message || 'Invalid or expired quiz code. Please check with your faculty.');
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Join Quiz via Secret Code Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-amber-400" /> Enter Faculty Examination Code
          </div>
          <h2 className="mt-1 text-xl font-bold">Ready to take an assigned assessment?</h2>
          <p className="mt-1 text-xs text-slate-300">
            Type the 8-character secret code provided by your course faculty (e.g. DSA7K29X)
          </p>

          <form onSubmit={handleJoinByCode} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={secretCode}
              onChange={e => setSecretCode(e.target.value.toUpperCase())}
              placeholder="SECRET CODE (e.g. DSA7K29X)"
              className="w-full uppercase font-mono tracking-widest rounded-xl border border-indigo-800 bg-slate-950 py-2.5 px-4 text-sm font-bold text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-hidden"
              required
            />
            <button
              type="submit"
              disabled={loadingCode}
              className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-md"
            >
              {loadingCode ? 'Finding Quiz...' : 'Start Quiz'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {codeError && (
            <div className="mt-3 rounded-lg bg-rose-950/80 border border-rose-500/40 p-2.5 text-xs font-semibold text-rose-300">
              {codeError}
            </div>
          )}
        </div>
      </div>

      {/* CSE B.Tech Practice Quizzes Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" /> CSE B.Tech Self-Practice Quizzes
          </h2>
          <p className="text-xs text-slate-500">Practice core computer science subjects anytime with instant feedback</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {practiceQuizzes.map(pq => (
            <div
              key={pq.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-300 transition"
            >
              <div>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                  {pq.subject}
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{pq.title}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{pq.description}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {pq.questions.length} Questions &bull; {pq.durationMinutes}m
                </span>
                <button
                  onClick={() => onStartPracticeQuiz(pq)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition"
                >
                  Practice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempt History */}
      {user && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" /> My Exam Attempt History
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Quiz Title</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Percentage</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {loadingData ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Loading your past attempts...
                      </td>
                    </tr>
                  ) : attempts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No quiz attempts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    attempts.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{att.quizTitle}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {att.score} / {att.totalMarks}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-700">
                          {att.percentage}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          {att.passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3" /> FAIL
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(att.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
