import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Question } from '../../types';
import { CSVImportModal } from './CSVImportModal';
import { AIQuestionModal } from './AIQuestionModal';
import {
  FileText,
  HelpCircle,
  Settings,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  FileSpreadsheet,
  Bot,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface CreateQuizWizardProps {
  onSuccess: () => void;
}

export const CreateQuizWizard: React.FC<CreateQuizWizardProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Data Structures');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(50);

  // Step 2: Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  // Manual Question Form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualQText, setManualQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [manualMarks, setManualMarks] = useState(1);
  const [manualExp, setManualExp] = useState('');
  const [manualCode, setManualCode] = useState('');

  // Modals
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Step 3: Settings
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [enableAntiCheating, setEnableAntiCheating] = useState(true);

  // Step 4: Schedule
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQText || !optA || !optB || !optC || !optD) {
      alert('Please fill in question text and all 4 options.');
      return;
    }

    const newQ: Question = {
      id: `manual-q-${Date.now()}`,
      question: manualQText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC },
        { key: 'D', text: optD }
      ],
      correctAnswer,
      marks: manualMarks,
      difficulty,
      explanation: manualExp,
      topic: topic || 'General',
      codeSnippet: manualCode || undefined
    };

    setQuestions([...questions, newQ]);
    setShowManualForm(false);

    // Reset manual form
    setManualQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setManualExp('');
    setManualCode('');
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveQuiz = async (publishNow: boolean = false) => {
    if (!title || !topic) {
      setError('Quiz Title and Topic are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await api.createQuiz({
        title,
        description,
        topic,
        category,
        difficulty,
        facultyId: user?.id,
        facultyName: user?.name,
        passingPercentage,
        settings: {
          durationMinutes,
          marksPerQuestion: 1,
          enableNegativeMarking,
          negativeMarks,
          maxAttempts,
          randomizeQuestions,
          randomizeOptions,
          allowPreviousNavigation: true,
          allowMarkForReview: true,
          showResultsImmediately: true,
          showCorrectAnswers: true,
          showExplanations: true,
          enableAntiCheating
        },
        schedule: {
          startDate,
          startTime,
          endDate,
          endTime
        },
        questions
      });

      if (publishNow && created.id) {
        await api.publishQuiz(created.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed saving quiz.');
    } finally {
      setSaving(false);
    }
  };

  const wizardSteps = [
    { num: 1, label: 'Basic Info', icon: FileText },
    { num: 2, label: 'Questions', icon: HelpCircle },
    { num: 3, label: 'Settings', icon: Settings },
    { num: 4, label: 'Schedule', icon: Calendar },
    { num: 5, label: 'Review & Publish', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Create New Assessment Quiz</h1>
        <p className="text-xs text-slate-500">5-Step Wizard for manual, CSV, or AI-generated quiz creation</p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
        {wizardSteps.map(s => {
          const Icon = s.icon;
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              onClick={() => { if (isDone) setStep(s.num); }}
              className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-bold transition ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 1: Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Quiz Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Mid-Term Practice Test"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Topic (Teacher Controlled) *</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Linked Lists & Binary Trees"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter quiz instructions, syllabus scope, or details..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              >
                <option value="Data Structures">Data Structures</option>
                <option value="DBMS">DBMS</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Programming in C/C++">Programming in C/C++</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Passing Score (%)</label>
              <input
                type="number"
                value={passingPercentage}
                onChange={e => setPassingPercentage(parseInt(e.target.value) || 50)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                if (!title || !topic) alert('Please enter Title and Topic.');
                else setStep(2);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-xs"
            >
              <span>Next: Add Questions</span> <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Questions */}
      {step === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Step 2: Add Questions ({questions.length} Added)</h3>
              <p className="text-xs text-slate-500">Choose from Manual Entry, CSV Import, or AI Question Generation</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" /> Manual Question
              </button>
              <button
                onClick={() => setShowCSVModal(true)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" /> CSV Import
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:from-indigo-500 hover:to-blue-500 shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI Question Generator
              </button>
            </div>
          </div>

          {/* Manual Question Form Drawer */}
          {showManualForm && (
            <form onSubmit={handleAddManualQuestion} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900">Add Manual Question</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Question Text *</label>
                <input
                  type="text"
                  value={manualQText}
                  onChange={e => setManualQText(e.target.value)}
                  placeholder="Enter multiple choice question statement..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Code Snippet (Optional)</label>
                <textarea
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Paste C++, Java, Python, or SQL code snippet if applicable..."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-900 p-2 font-mono text-xs text-indigo-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={optA}
                  onChange={e => setOptA(e.target.value)}
                  placeholder="Option A *"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  required
                />
                <input
                  type="text"
                  value={optB}
                  onChange={e => setOptB(e.target.value)}
                  placeholder="Option B *"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  required
                />
                <input
                  type="text"
                  value={optC}
                  onChange={e => setOptC(e.target.value)}
                  placeholder="Option C *"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  required
                />
                <input
                  type="text"
                  value={optD}
                  onChange={e => setOptD(e.target.value)}
                  placeholder="Option D *"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Correct Option</label>
                  <select
                    value={correctAnswer}
                    onChange={e => setCorrectAnswer(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Marks</label>
                  <input
                    type="number"
                    value={manualMarks}
                    onChange={e => setManualMarks(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Explanation</label>
                  <input
                    type="text"
                    value={manualExp}
                    onChange={e => setManualExp(e.target.value)}
                    placeholder="Optional answer explanation"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Add Question
                </button>
              </div>
            </form>
          )}

          {/* List of Added Questions */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
                No questions added yet. Click Manual Question, CSV Import, or AI Question Generator above.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Question {idx + 1} ({q.difficulty})</span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-900">{q.question}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                    {q.options.map(o => (
                      <div key={o.key} className={`rounded p-1 ${o.key === q.correctAnswer ? 'bg-emerald-100 font-bold text-emerald-800' : ''}`}>
                        {o.key}. {o.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <span>Next: Quiz Settings</span> <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Quiz Settings */}
      {step === 3 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 3: Quiz Assessment Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableNegativeMarking}
                onChange={e => setEnableNegativeMarking(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <div className="font-bold">Enable Negative Marking</div>
                <div className="text-[11px] text-slate-500 font-normal">Deduct marks for wrong answers</div>
              </div>
            </label>

            {enableNegativeMarking && (
              <div>
                <label className="block text-xs font-bold text-slate-700">Negative Mark Value</label>
                <input
                  type="number"
                  step="0.05"
                  value={negativeMarks}
                  onChange={e => setNegativeMarks(parseFloat(e.target.value) || 0.25)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                />
              </div>
            )}

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={e => setRandomizeQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <div className="font-bold">Randomize Question Order</div>
                <div className="text-[11px] text-slate-500 font-normal">Shuffle question positions for students</div>
              </div>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={e => setRandomizeOptions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <div className="font-bold">Randomize Options</div>
                <div className="text-[11px] text-slate-500 font-normal">Shuffle options A-D per question</div>
              </div>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer md:col-span-2">
              <input
                type="checkbox"
                checked={enableAntiCheating}
                onChange={e => setEnableAntiCheating(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <div className="font-bold text-indigo-900">Enable Exam Integrity / Anti-Cheating Monitoring</div>
                <div className="text-[11px] text-slate-500 font-normal">Track focus loss, tab switching, and fullscreen exits during assessment</div>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <span>Next: Schedule</span> <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Schedule */}
      {step === 4 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 4: Quiz Availability Schedule</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              <span>Next: Review & Publish</span> <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Publish */}
      {step === 5 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 5: Review & Confirm</h3>

          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
            <div><strong>Title:</strong> {title}</div>
            <div><strong>Topic:</strong> {topic}</div>
            <div><strong>Category:</strong> {category} | <strong>Difficulty:</strong> {difficulty}</div>
            <div><strong>Questions:</strong> {questions.length} total</div>
            <div><strong>Duration:</strong> {durationMinutes} mins | <strong>Passing:</strong> {passingPercentage}%</div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveQuiz(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSaveQuiz(true)}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
              >
                {saving ? 'Publishing...' : 'Publish & Generate Secret Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Modal */}
      <CSVImportModal
        quizId="temp-quiz"
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onApprovedImport={qs => setQuestions([...questions, ...qs])}
      />

      {/* AI Modal */}
      <AIQuestionModal
        initialTopic={topic}
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApprovedAdd={qs => setQuestions([...questions, ...qs])}
      />
    </div>
  );
};
