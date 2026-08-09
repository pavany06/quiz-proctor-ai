import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'cpp' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm shadow-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span className="uppercase font-semibold tracking-wider text-[11px]">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-slate-800 text-slate-300 transition"
          title="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-indigo-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};
