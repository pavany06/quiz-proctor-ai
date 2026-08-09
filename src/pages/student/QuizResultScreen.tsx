import React, { useEffect, useState } from 'react';
import { Attempt } from '../../types';
import { api } from '../../lib/api';
import { CodeBlock } from '../../components/CodeBlock';
import { Award, CheckCircle2, XCircle, BrainCircuit, ArrowLeft, HelpCircle } from 'lucide-react';

interface QuizResultScreenProps {
  attempt: Attempt;
  onBackToPortal: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({ attempt, onBackToPortal }) => {
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [loadingMl, setLoadingMl] = useState(true);

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      const pred = await api.predictStudentPerformance({
        studentId: attempt.studentId,
        quizScore: attempt.percentage,
        timeTakenMinutes: Math.ceil(attempt.timeTakenSeconds / 60),
        previousAttemptsCount: 1,
        focusLostCount: attempt.integrityData?.focusLostCount || 0
      });
      setMlPrediction(pred);
    } catch (err) {
      console.error('Failed loading ML prediction:', err);
    } finally {
      setLoadingMl(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <button
        onClick={onBackToPortal}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Student Dashboard
      </button>

      {/* Score Banner */}
      <div className={`rounded-2xl border p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 ${
        attempt.passed ? 'bg-gradient-to-r from-emerald-900 to-slate-900 border-emerald-500/40' : 'bg-gradient-to-r from-rose-950 to-slate-900 border-rose-500/40'
      }`}>
        <div className="space-y-1 text-center md:text-left">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-200">
            Assessment Submission Summary
          </span>
          <h1 className="text-2xl font-bold mt-2">{attempt.quizTitle}</h1>
          <p className="text-xs text-slate-300">
            Submitted at {new Date(attempt.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-center">
          <div>
            <div className="text-3xl font-black">{attempt.score} / {attempt.totalMarks}</div>
            <div className="text-xs text-slate-300 font-semibold">{attempt.percentage}% Overall Score</div>
          </div>

          <div className="flex flex-col items-center">
            {attempt.passed ? (
              <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950">
                <CheckCircle2 className="h-4 w-4" /> PASSED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white">
                <XCircle className="h-4 w-4" /> FAILED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ML Performance Prediction Banner */}
      {mlPrediction && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <BrainCircuit className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  ML Supervised Performance Trajectory
                </h3>
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {mlPrediction.bestModelName} Model
                </span>
              </div>

              <div className="mt-1 text-sm font-bold text-slate-900">
                Predicted Outcome: <span className={mlPrediction.predictedOutcome === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{mlPrediction.predictedOutcome}</span> ({mlPrediction.passProbability}% Probability)
              </div>

              <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                {mlPrediction.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question Review */}
      <div className="space-y-4 pt-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600" /> Question-by-Question Review
        </h2>

        <div className="space-y-4">
          {attempt.answers.map((ans, idx) => (
            <div key={idx} className={`rounded-xl border p-5 shadow-2xs ${
              ans.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Question {idx + 1}</span>
                {ans.isCorrect ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Correct (+{ans.marksAwarded} Marks)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-700">
                    <XCircle className="h-4 w-4" /> Incorrect (0 Marks)
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs font-semibold text-slate-900">
                Question statement verified in submission report.
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                <div className={`rounded-lg border p-3 ${ans.isCorrect ? 'border-emerald-300 bg-emerald-100/60 text-emerald-900' : 'border-rose-300 bg-rose-100/60 text-rose-900'}`}>
                  <strong>Your Answer:</strong> Option {ans.selectedAnswer || 'Not Answered'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
