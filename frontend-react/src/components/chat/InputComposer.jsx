import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Paperclip, Sparkles, Zap,
  FileText, X, AlertCircle, Square
} from 'lucide-react';
import useAppStore from '../../store/appStore';
import { parseFileContent } from '../../lib/fileParser';

// ── Skill hint detector ───────────────────────────────────────────────────────
const SKILL_HINTS = [
  { match: /write|essay|article|blog/i,              label: 'Essay mode',    color: '#10B981' },
  { match: /html|artifact|generate|dashboard|build/i, label: 'Artifact mode', color: '#F59E0B' },
  { match: /.+/,                                     label: 'Q&A mode',      color: '#2563EB' },
];

const PLACEHOLDER_PROMPTS = [
  "What growth channels work best for B2B SaaS?",
  "How do the best PMs think about prioritization?",
  "Write an essay about product-market fit...",
  "Generate an HTML dashboard showing growth metrics...",
];


// ── File attachment pill ──────────────────────────────────────────────────────
function FilePill({ file, onRemove }) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isWord = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: isPdf ? '#FEF2F2' : isWord ? '#EFF6FF' : 'var(--color-primary-light)',
      border: `1px solid ${isPdf ? '#FECACA' : isWord ? '#BFDBFE' : 'var(--color-primary-ring)'}`,
      fontSize: 12, fontWeight: 600,
      color: isPdf ? '#DC2626' : isWord ? '#2563EB' : 'var(--color-primary)',
      maxWidth: 220,
    }}>
      <FileText size={13} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.name}
      </span>
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}
      >
        <X size={12} style={{ color: isPdf ? '#DC2626' : isWord ? '#2563EB' : 'var(--color-primary)' }} />
      </button>
    </div>
  );
}

export default function InputComposer() {
  const { sendMessage, isStreaming, llmProvider, addToast } = useAppStore();

  const [value, setValue]               = useState('');
  const [placeholder, setPlaceholder]   = useState(0);
  const [attachedFiles, setAttachedFiles] = useState([]);   // { name, content }
  const [isRecording, setIsRecording]   = useState(false);
  const [recordError, setRecordError]   = useState('');
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const interimRef   = useRef('');   // interim speech text

  // Cycle placeholder
  useEffect(() => {
    const id = setInterval(() => setPlaceholder(p => (p + 1) % PLACEHOLDER_PROMPTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // Edit-message event from MessageBubble
  useEffect(() => {
    const handler = (e) => { setValue(e.detail); textareaRef.current?.focus(); };
    document.addEventListener('edit-msg', handler);
    return () => document.removeEventListener('edit-msg', handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const rawValue = value.trim();
    if ((!rawValue && attachedFiles.length === 0) || isStreaming) return;

    let fullText = rawValue;
    if (attachedFiles.length > 0) {
      const fileBlocks = attachedFiles.map(f =>
        `\n\n--- File: ${f.name} ---\n${f.content}`
      ).join('');
      fullText = rawValue ? rawValue + fileBlocks : fileBlocks.trim();
    }

    const currentFiles = [...attachedFiles];
    setValue('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage(
      fullText,
      rawValue || null,
      currentFiles.map(f => ({ name: f.name }))
    );
  }, [value, isStreaming, sendMessage, attachedFiles]);


  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  // ── File Upload ─────────────────────────────────────────────────────────────
  const handleFileClick = () => {
    if (isStreaming || isParsingFile) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsParsingFile(true);
    const maxSize = 10 * 1024 * 1024; // 10 MB

    for (const file of files) {
      if (file.size > maxSize) {
        if (addToast) addToast(`File "${file.name}" is too large (max 10 MB)`, 'error');
        else alert(`File "${file.name}" is too large (max 10 MB)`);
        continue;
      }

      try {
        const content = await parseFileContent(file);
        setAttachedFiles(prev => {
          if (prev.find(f => f.name === file.name)) return prev;
          return [...prev, { name: file.name, content }];
        });
        if (addToast) addToast(`Attached "${file.name}"`, 'success');
      } catch (err) {
        if (addToast) addToast(err.message || `Failed to read file ${file.name}`, 'error');
        else alert(err.message);
      }
    }

    setIsParsingFile(false);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };


  // ── Voice Recording (Web Speech API) ────────────────────────────────────────
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicUnsupported(true);
      setRecordError('Speech recognition is not supported in this browser. Try Chrome.');
      setTimeout(() => setRecordError(''), 4000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognitionRef.current = recognition;

    const baseValue = value; // capture current text before recording
    interimRef.current = '';

    recognition.onresult = (event) => {
      let interim = '';
      let final   = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) { final += transcript + ' '; }
        else { interim += transcript; }
      }
      interimRef.current = interim;
      // Show real-time: base + finalized + interim
      setValue((baseValue ? baseValue + ' ' : '') + final + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setRecordError('Microphone access denied. Allow mic in browser settings.');
      } else if (event.error !== 'aborted') {
        setRecordError('Recording error: ' + event.error);
      }
      setTimeout(() => setRecordError(''), 4000);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
    setRecordError('');
    textareaRef.current?.focus();
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) { stopRecording(); }
    else { startRecording(); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const skill      = SKILL_HINTS.find(h => h.match.test(value));
  const charCount  = value.length;
  const llmLabel   = llmProvider === 'anthropic' ? 'Claude Haiku' : 'Llama 3.2';
  const canSend    = (value.trim() || attachedFiles.length > 0) && !isStreaming;

  return (
    <div style={{ padding: '12px 16px 16px', flexShrink: 0 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Skill hint */}
        <AnimatePresence>
          {value && skill && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 8, marginLeft: 4,
                fontSize: 12, fontWeight: 600, color: skill.color,
              }}
            >
              <Sparkles size={12} />
              {skill.label}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording error banner */}
        <AnimatePresence>
          {recordError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', marginBottom: 8,
                borderRadius: 10, fontSize: 12, fontWeight: 500,
                color: 'var(--color-danger)',
                background: 'var(--color-danger-light)',
                border: '1px solid var(--color-danger-ring)',
              }}
            >
              <AlertCircle size={13} />
              {recordError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attached files row */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}
            >
              {attachedFiles.map((f, i) => (
                <FilePill
                  key={i}
                  file={f}
                  onRemove={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer box */}
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 18,
          border: `1px solid ${isRecording ? 'var(--color-danger)' : 'var(--color-border)'}`,
          boxShadow: isRecording
            ? '0 0 0 3px rgba(239,68,68,0.12), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          {/* Recording pulse indicator */}
          {isRecording && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px 0',
              fontSize: 12, fontWeight: 600, color: 'var(--color-danger)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--color-danger)',
                animation: 'pulse-soft 1s ease-in-out infinite',
                display: 'inline-block',
              }} />
              Recording… speak now
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isStreaming}
            placeholder={isRecording ? 'Listening…' : PLACEHOLDER_PROMPTS[placeholder]}
            rows={1}
            className="scrollbar-thin"
            style={{
              width: '100%', background: 'transparent',
              padding: '14px 20px 8px',
              fontSize: 13.5, color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)', lineHeight: 1.6,
              border: 'none', outline: 'none', resize: 'none',
              maxHeight: 200, boxSizing: 'border-box',
            }}
          />

          {/* Footer bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px 10px',
          }}>
            {/* Left: file + mic + model */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* File upload */}
              <button
                className="btn-icon"
                onClick={handleFileClick}
                disabled={isStreaming || isParsingFile}
                title="Attach files (PDF, Word, TXT, Code, CSV…)"
                style={{ opacity: (isStreaming || isParsingFile) ? 0.4 : 1 }}
              >
                <Paperclip size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md,.py,.js,.ts,.jsx,.tsx,.css,.html,.json,.csv,.yaml,.yml,.xml,.sh,.sql,.rs,.go,.java,.c,.cpp,.h"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />


              {/* Mic / stop recording */}
              <button
                className="btn-icon"
                onClick={toggleRecording}
                disabled={isStreaming}
                title={isRecording ? 'Stop recording' : 'Voice input (speech to text)'}
                style={{
                  opacity: isStreaming ? 0.4 : 1,
                  background: isRecording ? 'var(--color-danger-light)' : 'transparent',
                  color: isRecording ? 'var(--color-danger)' : undefined,
                  border: isRecording ? '1px solid var(--color-danger-ring)' : 'none',
                }}
              >
                {isRecording ? <Square size={14} style={{ fill: 'currentColor' }} /> : <Mic size={16} />}
              </button>

              {/* Model badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginLeft: 4, padding: '5px 10px', borderRadius: 8,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                fontSize: 12, fontWeight: 600, color: 'var(--color-ink-secondary)',
              }}>
                <Zap size={12} style={{ color: 'var(--color-primary)' }} />
                {llmLabel}
              </div>
            </div>

            {/* Right: char count + send */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {charCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: charCount > 9000 ? 'var(--color-danger)' : 'var(--color-ink-muted)',
                }}>
                  {charCount.toLocaleString()} / 10,000
                </span>
              )}
              <motion.button
                onClick={submit}
                disabled={!canSend}
                whileHover={canSend ? { scale: 1.06 } : {}}
                whileTap={canSend ? { scale: 0.94 } : {}}
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
                  background: canSend ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: canSend ? '#fff' : 'var(--color-ink-muted)',
                  boxShadow: canSend ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {isStreaming
                  ? <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--color-ink-muted)' }} />
                  : <Send size={15} />
                }
              </motion.button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
