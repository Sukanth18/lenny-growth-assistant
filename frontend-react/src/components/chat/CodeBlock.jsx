import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

// Prism loaded via CDN in index.html
function highlight(code, lang) {
  if (typeof Prism !== 'undefined' && Prism.languages[lang]) {
    try { return Prism.highlight(code, Prism.languages[lang], lang); } catch { /* fallback */ }
  }
  return code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const LANG_LABELS = {
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  python: 'Python', py: 'Python', html: 'HTML', css: 'CSS', json: 'JSON',
  bash: 'Bash', sh: 'Shell', sql: 'SQL', markup: 'HTML',
};

export default function CodeBlock({ code, lang = '' }) {
  const [copied, setCopied] = useState(false);
  const label = LANG_LABELS[lang.toLowerCase()] || lang || 'Code';
  const highlighted = highlight(code, lang.toLowerCase());

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }, [code]);

  return (
    <div className="rounded-xl overflow-hidden border border-border my-3 bg-[#1E293B] group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border-b border-white/10">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <><Check size={13} className="text-secondary" /><span className="text-secondary">Copied!</span></>
          ) : (
            <><Copy size={13} /><span>Copy</span></>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="px-5 py-4 overflow-x-auto text-[13px] leading-[1.7] font-mono">
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
          style={{ color: '#E2E8F0' }}
        />
      </pre>
    </div>
  );
}
