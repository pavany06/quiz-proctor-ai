import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Quiz } from '../../types';
import { ShareQuizModal } from './ShareQuizModal';
import { ListChecks, PlusCircle, Share2, Copy, Check, Trash2, CheckCircle2, Clock, HelpCircle } from 'lucide-react';

interface MyQuizzesProps {
  onNavigateToCreate: () => void;
}

export const MyQuizzes: React.FC<MyQuizzesProps> = ({ onNavigateToCreate }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const [shareQuiz, setShareQuiz] = useState<Quiz | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getFacultyQuizzes(user.id);
      setQuizzes(data);
    } catch (err) {
      console.error('Failed loading faculty quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (quizId: string) => {
    try {
      await api.publishQuiz(quizId);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Failed publishing quiz.');
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.deleteQuiz(quizId);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Failed deleting quiz.');
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Quiz Management</h1>
          <p className="text-xs text-slate-500">Manage created quizzes, secret codes, and publishing status</p>
        </div>
        <button
          onClick={onNavigateToCreate}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
        >
          <PlusCircle className="h-4 w-4" /> Create New Quiz
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
          No quizzes created yet. Click "+ Create New Quiz" to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-200 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    quiz.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {quiz.status}
                  </span>

                  <div className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 border border-indigo-100">
                    <span>Code: {quiz.secretCode}</span>
                    <button
                      onClick={() => handleCopyCode(quiz.id, quiz.secretCode)}
                      className="ml-1 text-indigo-500 hover:text-indigo-800"
                      title="Copy Secret Code"
                    >
                      {copiedCodeId === quiz.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{quiz.title}</h3>
                <p className="mt-0.5 text-xs text-slate-600 font-medium">Topic: {quiz.topic}</p>

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" /> {quiz.questions?.length || 0} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {quiz.durationMinutes} mins
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareQuiz(quiz)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Share2 className="h-3.5 w-3.5 text-indigo-600" /> Share Code
                  </button>
                  {quiz.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(quiz.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Delete Quiz"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Quiz Modal */}
      {shareQuiz && (
        <ShareQuizModal
          quiz={shareQuiz}
          isOpen={!!shareQuiz}
          onClose={() => setShareQuiz(null)}
          onCodeRegenerated={newCode => {
            setShareQuiz({ ...shareQuiz, secretCode: newCode });
            loadQuizzes();
          }}
        />
      )}
    </div>
  );
};
