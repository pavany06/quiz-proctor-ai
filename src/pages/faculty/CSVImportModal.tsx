import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Question } from '../../types';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, X, FileText } from 'lucide-react';

interface CSVImportModalProps {
  quizId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprovedImport: (questions: Question[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  quizId,
  isOpen,
  onClose,
  onApprovedImport
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    validQuestions: Question[];
    errors: { row: number; line: string; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!csvText.trim()) return;
    setParsing(true);
    setResult(null);

    try {
      const res = await api.importCSVQuestions(quizId || 'temp-quiz', csvText);
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed parsing CSV.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (result && result.validQuestions.length > 0) {
      onApprovedImport(result.validQuestions);
      onClose();
    }
  };

  const sampleCSV = `"question","option_a","option_b","option_c","option_d","correct_answer","marks","difficulty","explanation","topic"
"What is the time complexity of binary search?","O(n)","O(log n)","O(n²)","O(1)","B",1,"Medium","Binary search repeatedly divides the search space in half.","Searching"
"Which data structure follows First In First Out (FIFO)?","Stack","Queue","Tree","Graph","B",1,"Easy","Queue processes elements in FIFO order.","Queues"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Import Questions via CSV</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">Paste CSV Content</label>
            <p className="mt-0.5 text-[11px] text-slate-500">
              CSV Format: <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">question, option_a, option_b, option_c, option_d, correct_answer, marks, difficulty, explanation, topic</code>
            </p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={sampleCSV}
              rows={8}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-indigo-200 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setCsvText(sampleCSV)}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" /> Load Sample CSV Template
            </button>

            <button
              onClick={handleParse}
              disabled={parsing || !csvText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {parsing ? 'Validating CSV...' : 'Validate & Preview CSV'}
            </button>
          </div>

          {/* Validation Report */}
          {result && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800">CSV Validation Report</span>
                <span className="text-slate-500">Total Rows: {result.totalRows}</span>
              </div>

              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{result.validCount} Valid Questions</span>
                </div>
                {result.invalidCount > 0 && (
                  <div className="flex items-center gap-1 text-rose-700">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>{result.invalidCount} Rejected Rows</span>
                  </div>
                )}
              </div>

              {/* Errors List */}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-1">
                  <div className="text-[11px] font-bold text-rose-800">Rejected Row Details:</div>
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-[11px] text-rose-700">
                      Row {err.row}: {err.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Valid Preview */}
              {result.validQuestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700">Preview Approved Questions ({result.validQuestions.length}):</div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {result.validQuestions.map((q, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                        <div className="font-bold text-slate-900">{idx + 1}. {q.question}</div>
                        <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                          <div>A: {q.options[0]?.text}</div>
                          <div>B: {q.options[1]?.text}</div>
                          <div>C: {q.options[2]?.text}</div>
                          <div>D: {q.options[3]?.text}</div>
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-emerald-700">Correct: {q.correctAnswer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!result || result.validCount === 0}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            Import {result?.validCount || 0} Valid Questions
          </button>
        </div>
      </div>
    </div>
  );
};
