import React, { useState } from 'react';
import { Quiz } from '../../types';
import { Share2, Copy, Check, MessageCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

interface ShareQuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onCodeRegenerated?: (newCode: string) => void;
}

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onCodeRegenerated
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen || !quiz) return null;

  const quizUrl = `${window.location.origin}/join/${quiz.secretCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.secretCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(quizUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Regenerate secret quiz code? Previous code will immediately become invalid.')) return;
    setRegenerating(true);
    try {
      const res = await api.regenerateQuizCode(quiz.id);
      if (onCodeRegenerated) onCodeRegenerated(res.secretCode);
    } catch (err: any) {
      alert(err.message || 'Failed regenerating code.');
    } finally {
      setRegenerating(false);
    }
  };

  // WhatsApp Pre-filled Message
  const whatsappText = encodeURIComponent(
    `*${quiz.title}* is now available!\n\nTopic: ${quiz.topic}\nQuiz Code: *${quiz.secretCode}*\n\nClick link to join assessment:\n${quizUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Share Quiz Assessment</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Secret Code Card */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unique Secret Quiz Code</div>
            <div className="mt-1 font-mono text-2xl font-black tracking-widest text-indigo-700">
              {quiz.secretCode}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-2xs transition"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700">Direct Shareable Link</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={quizUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* WhatsApp Sharing Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Share Quiz via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
