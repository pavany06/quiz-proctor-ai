import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Bot, Sparkles, Award, CheckCircle2, XCircle, BarChart2, RefreshCw } from 'lucide-react';

export const QuizResultsFaculty: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Insights State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyQuizResults();
      setAttempts(data);
    } catch (err) {
      console.error('Failed loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIAnalysis = async () => {
    if (attempts.length === 0) {
      alert('No student attempts available to generate AI analysis.');
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await api.getAIQuizAnalysis(attempts);
      setAiAnalysis(res);
    } catch (err: any) {
      alert(err.message || 'Failed generating AI analysis.');
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quiz Assessment Results & Analytics</h1>
          <p className="text-xs text-slate-500">Student score reports, pass rates, and Gemini AI performance recommendations</p>
        </div>

        <button
          onClick={handleGenerateAIAnalysis}
          disabled={generatingAi || attempts.length === 0}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 transition"
        >
          {generatingAi ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating AI Analysis...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              Generate AI Performance Insights
            </>
          )}
        </button>
      </div>

      {/* AI Performance Insights Card */}
      {aiAnalysis && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <Bot className="h-4 w-4 text-amber-400" /> Gemini AI Academic Analysis Report
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-indigo-800/80 pt-4 text-xs">
            <div>
              <div className="text-indigo-300 font-semibold">Strengths Identified:</div>
              <ul className="mt-1 list-disc list-inside space-y-1 text-indigo-100">
                {aiAnalysis.strengths?.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-rose-300 font-semibold">Areas Needing Improvement:</div>
              <ul className="mt-1 list-disc list-inside space-y-1 text-indigo-100">
                {aiAnalysis.weaknesses?.map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-amber-300 font-semibold">Faculty Recommendations:</div>
              <ul className="mt-1 list-disc list-inside space-y-1 text-indigo-100">
                {aiAnalysis.recommendations?.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Student Attempts Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Student Assessment Attempts</h3>
          <span className="text-xs font-semibold text-slate-500">Total Attempts: {attempts.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Quiz Title</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Percentage</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-center">Time Spent</th>
                <th className="px-4 py-3">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading quiz attempt results...
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No student attempt submissions recorded yet.
                  </td>
                </tr>
              ) : (
                attempts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.studentName}</td>
                    <td className="px-4 py-3 text-slate-800">{a.quizTitle}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {a.score} / {a.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-700">
                      {a.percentage}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.passed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                          <XCircle className="h-3 w-3" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {Math.floor((a.timeTakenSeconds || 0) / 60)}m {(a.timeTakenSeconds || 0) % 60}s
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(a.submittedAt).toLocaleString()}
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
