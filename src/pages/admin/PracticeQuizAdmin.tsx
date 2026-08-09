import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PracticeQuiz, Question } from '../../types';
import { BookOpen, Plus, CheckCircle2, Clock, HelpCircle, Code } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

export const PracticeQuizAdmin: React.FC = () => {
  const [practiceQuizzes, setPracticeQuizzes] = useState<PracticeQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<PracticeQuiz | null>(null);

  useEffect(() => {
    loadPracticeQuizzes();
  }, []);

  const loadPracticeQuizzes = async () => {
    setLoading(true);
    try {
      const data = await api.getPracticeQuizzes();
      setPracticeQuizzes(data);
    } catch (err) {
      console.error('Failed loading practice quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CSE B.Tech Practice Quiz Management</h1>
          <p className="text-xs text-slate-500">Curated, high-quality self-practice assessments managed by System Admin</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-slate-400 text-xs">
          Loading Practice Quizzes...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {practiceQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-200 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                    {quiz.subject}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {quiz.durationMinutes} mins
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{quiz.title}</h3>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{quiz.description}</p>

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                    <span>{quiz.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Pass: {quiz.passingPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Difficulty: <strong className="text-slate-800">{quiz.difficulty}</strong>
                </span>
                <button
                  onClick={() => setSelectedQuiz(quiz)}
                  className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  View Questions ({quiz.questions.length})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Questions Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedQuiz.title}</h3>
                <p className="text-xs text-slate-500">{selectedQuiz.subject} &bull; {selectedQuiz.questions.length} Questions</p>
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedQuiz.questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Question {idx + 1} ({q.difficulty})</span>
                    <span>{q.marks} Mark(s)</span>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-slate-900">{q.question}</div>

                  {q.codeSnippet && <CodeBlock code={q.codeSnippet} />}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map(opt => (
                      <div
                        key={opt.key}
                        className={`rounded-lg border p-2 text-xs font-medium ${
                          opt.key === q.correctAnswer
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="font-bold mr-1">{opt.key}.</span> {opt.text}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 rounded-lg bg-amber-50/70 border border-amber-200/60 p-2 text-[11px] text-amber-900">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
