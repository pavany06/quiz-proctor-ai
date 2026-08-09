import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Question } from '../../types';
import { Bot, Sparkles, Check, Trash2, RefreshCw, X, Edit3, CheckCircle2 } from 'lucide-react';

interface AIQuestionModalProps {
  initialTopic?: string;
  isOpen: boolean;
  onClose: () => void;
  onApprovedAdd: (questions: Question[]) => void;
}

export const AIQuestionModal: React.FC<AIQuestionModalProps> = ({
  initialTopic = '',
  isOpen,
  onClose,
  onApprovedAdd
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [instructions, setInstructions] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateAIQuestions({
        topic,
        numberOfQuestions,
        difficulty,
        additionalInstructions: instructions
      });
      setGeneratedQuestions(res.questions);
      setSelectedIds(res.questions.map((q: Question) => q.id));
    } catch (err: any) {
      alert(err.message || 'Failed generating questions via AI.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = (id: string) => {
    setGeneratedQuestions(generatedQuestions.filter(q => q.id !== id));
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const handleConfirmAdd = () => {
    const approved = generatedQuestions.filter(q => selectedIds.includes(q.id));
    if (approved.length > 0) {
      onApprovedAdd(approved);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold">AI Question Generator</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Generator Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Dynamic Programming, Normalization, TCP/IP"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Count</label>
              <select
                value={numberOfQuestions}
                onChange={e => setNumberOfQuestions(parseInt(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Additional Instructions (Optional)</label>
              <input
                type="text"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Focus on time complexity and recursion"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 transition"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating Questions via Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Generate AI Questions
              </>
            )}
          </button>

          {/* Teacher Review Step */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">
                  Teacher Review Step ({selectedIds.length} / {generatedQuestions.length} Selected)
                </h4>
                <p className="text-[11px] text-slate-500">Uncheck or delete questions you wish to exclude</p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-3.5 transition ${
                        isSelected ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(q.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-900">Question {idx + 1}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="text-slate-400 hover:text-rose-600"
                          title="Delete Question"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 text-xs font-medium text-slate-800">{q.question}</div>

                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                        {q.options.map(o => (
                          <div
                            key={o.key}
                            className={`rounded p-1 ${
                              o.key === q.correctAnswer ? 'font-bold text-emerald-800 bg-emerald-100/70' : ''
                            }`}
                          >
                            {o.key}. {o.text}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="mt-2 text-[10px] text-slate-500 italic">
                          Explanation: {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAdd}
            disabled={selectedIds.length === 0}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            Approve & Add {selectedIds.length} Selected
          </button>
        </div>
      </div>
    </div>
  );
};
