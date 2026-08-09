import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Quiz, PracticeQuiz, Attempt } from '../../types';
import { CodeBlock } from '../../components/CodeBlock';
import {
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Maximize2,
  Lock,
  AlertTriangle,
  EyeOff,
  Ban,
  CopyX,
  Radio
} from 'lucide-react';

interface QuizTakingScreenProps {
  quiz: Quiz | PracticeQuiz;
  isPractice?: boolean;
  onFinish: (attempt: Attempt) => void;
  onCancel: () => void;
}

export const QuizTakingScreen: React.FC<QuizTakingScreenProps> = ({
  quiz,
  isPractice = false,
  onFinish,
  onCancel
}) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User Answers: { [questionId]: optionKey }
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  // Review Status: { [questionId]: boolean }
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});

  // Timer in seconds
  const [timeLeft, setTimeLeft] = useState((quiz.durationMinutes || 30) * 60);

  // Security & Integrity Tracker
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [fullscreenExitsCount, setFullscreenExitsCount] = useState(0);
  const [clipboardAttempts, setClipboardAttempts] = useState(0);
  const [devToolsDetectedCount, setDevToolsDetectedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [cheatingWarningMsg, setCheatingWarningMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(true);

  const questions = quiz.questions || [];
  const currentQ = questions[currentIdx];

  // Request Fullscreen
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn('Fullscreen request denied or not supported:', err);
      setShowFullscreenModal(false);
    }
  };

  // Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Comprehensive Anti-Cheating & Integrity Guarding
  useEffect(() => {
    // 1. Right Click Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('RIGHT_CLICK', 'Right click / context menu prevented during exam.');
      triggerSecurityWarning('Right-click context menu is disabled during the examination.');
    };

    // 2. Copy/Paste/Cut Prevention
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setClipboardAttempts(prev => prev + 1);
      logViolation('CLIPBOARD_ATTEMPT', `Attempted ${e.type} operation on question text/options.`);
      triggerSecurityWarning(`Copy/Paste/Cut operations are strictly prohibited during the exam.`);
    };

    // 3. Restricted Key Combinations (DevTools, PrintScreen, Copy shortcuts, AI assistant triggers)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Prevent PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('SCREENSHOT', 'PrintScreen key pressed.');
        triggerSecurityWarning('Screenshots are monitored and disabled during testing.');
        return;
      }

      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (Inspect / DevTools)
      if (
        e.key === 'F12' ||
        (ctrlOrCmd && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (ctrlOrCmd && ['u', 'U', 's', 'S', 'p', 'P'].includes(e.key))
      ) {
        e.preventDefault();
        setDevToolsDetectedCount(prev => prev + 1);
        logViolation('DEVTOOLS_KEYS', `Attempted restricted shortcut: ${e.key}`);
        triggerSecurityWarning('Developer Tools & Source View shortcuts are restricted!');
        return;
      }

      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      if (ctrlOrCmd && ['c', 'v', 'x', 'a', 'C', 'V', 'X', 'A'].includes(e.key)) {
        e.preventDefault();
        setClipboardAttempts(prev => prev + 1);
        logViolation('CLIPBOARD_SHORTCUT', `Keyboard shortcut Ctrl+${e.key.toUpperCase()} blocked.`);
        triggerSecurityWarning(`Clipboard shortcuts (Ctrl+${e.key.toUpperCase()}) are disabled.`);
        return;
      }

      // Block Alt+Tab or Alt+Space (AI overlays / window switching)
      if (e.altKey && (e.key === 'Tab' || e.key === ' ' || e.key === 'Spacebar')) {
        logViolation('WINDOW_SWITCH_KEY', 'Alt+Tab/Space shortcut detected.');
        triggerSecurityWarning('Window switching shortcuts detected and logged.');
      }
    };

    // 4. Fullscreen State Monitoring
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(isFS);

      if (!isFS && !showFullscreenModal) {
        setFullscreenExitsCount(prev => {
          const next = prev + 1;
          logViolation('FULLSCREEN_EXIT', `Exited fullscreen mode attempt #${next}`);
          return next;
        });
        triggerSecurityWarning('ALERT: Fullscreen mode exited! Re-enter fullscreen to continue safely.');
        setShowFullscreenModal(true);
      }
    };

    // 5. Visibility / Window Focus Monitoring (Detecting Alt-Tab or AI helper popups like Gemini / Copilot)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLostCount(prev => {
          const next = prev + 1;
          logViolation('FOCUS_LOST', `Window focus loss / Tab switch / AI tool popup detected #${next}`);
          return next;
        });
        triggerSecurityWarning('WARNING: Window focus lost or external application/tab opened!');
      }
    };

    const handleWindowBlur = () => {
      setFocusLostCount(prev => prev + 1);
      logViolation('WINDOW_BLUR', 'Browser window lost focus.');
    };

    // 6. DevTools Window Dimensions Heuristic Check
    const checkDevTools = () => {
      const threshold = 170;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        setDevToolsDetectedCount(prev => prev + 1);
        logViolation('DEVTOOLS_OPEN', 'DevTools panel detection via window dimensions delta.');
      }
    };
    const devToolsInterval = setInterval(checkDevTools, 3000);

    // Attach All Event Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [showFullscreenModal]);

  const triggerSecurityWarning = (msg: string) => {
    setCheatingWarningMsg(msg);
  };

  const logViolation = async (eventType: string, details: string) => {
    try {
      await api.logIntegrityEvent({
        attemptId: `temp-${Date.now()}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: user?.id || 'guest',
        studentName: user?.name || 'Guest Student',
        eventType: eventType as any,
        details
      });
    } catch (e) {
      console.error('Failed logging integrity event:', e);
    }
  };

  const handleSelectOption = (key: string) => {
    setUserAnswers({ ...userAnswers, [currentQ.id]: key });
  };

  const toggleMarkReview = () => {
    setMarkedForReview({ ...markedForReview, [currentQ.id]: !markedForReview[currentQ.id] });
  };

  const clearResponse = () => {
    const updated = { ...userAnswers };
    delete updated[currentQ.id];
    setUserAnswers(updated);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: userAnswers[q.id] || '',
        isCorrect: userAnswers[q.id] === q.correctAnswer,
        marksAwarded: userAnswers[q.id] === q.correctAnswer ? (q.marks || 1) : 0
      }));

      const suspiciousScore = Math.min(
        100,
        focusLostCount * 20 + fullscreenExitsCount * 30 + clipboardAttempts * 15 + devToolsDetectedCount * 25
      );

      const payload = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: user?.id || `student-${Date.now()}`,
        studentName: user?.name || 'Guest Student',
        studentEmail: user?.email || 'guest@student.edu',
        answers: formattedAnswers,
        timeTakenSeconds: (quiz.durationMinutes || 30) * 60 - timeLeft,
        integrityData: {
          focusLostCount,
          fullscreenExitsCount,
          disconnectsCount: 0,
          suspiciousScore
        }
      };

      const result = await api.submitQuizAttempt(payload);

      // Exit fullscreen when finishing
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      onFinish(result);
    } catch (err: any) {
      alert(err.message || 'Failed submitting quiz attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 overflow-hidden select-none"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{quiz.title}</span>
              <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                Proctored Environment Active
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Topic: {quiz.topic} &bull; Student: <span className="text-slate-200 font-semibold">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Timer */}
        <div className="flex items-center gap-3">
          {/* Integrity Monitors Status */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Ban className="h-3.5 w-3.5 text-indigo-400" /> Right-Click Off
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-300">
              <CopyX className="h-3.5 w-3.5 text-indigo-400" /> Copy Locked
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-300">
              <EyeOff className="h-3.5 w-3.5 text-indigo-400" /> Focus Tracked
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 border border-slate-800 font-mono text-sm font-bold text-amber-400 shadow-inner">
            <Clock className="h-4 w-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Cheating Alert Banner */}
      {cheatingWarningMsg && (
        <div className="flex items-center justify-between bg-rose-950/90 border-b border-rose-500/40 px-6 py-2.5 text-xs font-semibold text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{cheatingWarningMsg}</span>
          </div>
          <button
            onClick={() => setCheatingWarningMsg(null)}
            className="rounded-lg bg-rose-900/60 px-3 py-1 text-[11px] text-rose-200 border border-rose-700/50 hover:bg-rose-800"
          >
            Acknowledge Warning
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {currentQ?.marks || 1} Mark(s) &bull; Difficulty: {currentQ?.difficulty || 'Medium'}
              </span>
            </div>

            <div className="mt-4 text-base font-semibold text-white leading-relaxed select-none">
              {currentQ?.question}
            </div>

            {currentQ?.codeSnippet && (
              <div className="select-none">
                <CodeBlock code={currentQ.codeSnippet} />
              </div>
            )}

            {/* Options */}
            <div className="mt-6 space-y-3">
              {currentQ?.options.map(opt => {
                const isSelected = userAnswers[currentQ.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-xs font-medium transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/70 text-white font-bold shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-800/90 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono font-bold text-xs ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600 text-white'
                          : 'border-slate-700 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex gap-2">
              <button
                onClick={clearResponse}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Clear Response
              </button>
              <button
                onClick={toggleMarkReview}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  markedForReview[currentQ?.id]
                    ? 'border-amber-500/50 bg-amber-950/80 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{markedForReview[currentQ?.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition shadow-sm"
              >
                Save & Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette Sidebar */}
        <aside className="hidden w-72 shrink-0 border-l border-slate-800 bg-slate-900/60 p-5 lg:block overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Palette</h3>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAns = !!userAnswers[q.id];
              const isMarked = !!markedForReview[q.id];
              const isCurr = idx === currentIdx;

              let btnStyle = 'border-slate-800 bg-slate-950 text-slate-400';
              if (isAns) btnStyle = 'border-emerald-500 bg-emerald-950 text-emerald-300 font-bold';
              if (isMarked) btnStyle = 'border-amber-500 bg-amber-950 text-amber-300 font-bold';
              if (isCurr) btnStyle += ' ring-2 ring-indigo-500';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`flex h-10 items-center justify-center rounded-lg border text-xs font-mono transition ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-950 border border-emerald-500" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-amber-950 border border-amber-500" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-950 border border-slate-800" />
              <span>Unanswered ({questions.length - answeredCount})</span>
            </div>
          </div>

          {/* Real-time Anti-Cheating Telemetry */}
          <div className="mt-6 border-t border-slate-800 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2">Integrity Telemetry</h4>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Focus Loss:</span>
                <span className={focusLostCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{focusLostCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Fullscreen Exits:</span>
                <span className={fullscreenExitsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{fullscreenExitsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Clipboard Attempts:</span>
                <span className={clipboardAttempts > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{clipboardAttempts}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Auto-Fullscreen Enforcer Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-indigo-500/40 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 border border-indigo-500/30 text-indigo-400">
              <Maximize2 className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Secure Fullscreen Mode Required</h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                This examination is monitored by web-based anti-cheating protocols. You must enter Fullscreen Mode to view question papers and attempt answers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-left text-xs space-y-2 text-slate-400">
              <div className="font-semibold text-slate-200">Enforced Integrity Rules:</div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Right-click context menu and text selection are disabled.</li>
                <li>Copy, paste, cut, and print screen shortcuts are blocked.</li>
                <li>Window tab switching & DevTools opening are tracked automatically.</li>
                <li>Exiting fullscreen triggers a faculty integrity alert log.</li>
              </ul>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-blue-500 transition"
            >
              Enter Secure Fullscreen & Begin Exam
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Submit Examination?</h3>
            <p className="mt-1 text-xs text-slate-400">
              You have answered {answeredCount} out of {questions.length} questions.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Return to Quiz
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

