import React, { useState, useCallback, useRef } from 'react';

import { motion } from 'framer-motion';
import { marked } from 'marked';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Share2,
  RotateCcw, MoreHorizontal, Edit3, FileCode2,
  Bookmark, BookmarkCheck, Paperclip
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import ShareModal from '../ui/ShareModal';
import useAppStore from '../../store/appStore';

// Extract clean user prompt and file attachments for visual bubble display
function getDisplayContent(msg) {
  // ── New messages: metadata explicitly set by appStore ──────────────────────
  // msg.attached_files is set whenever the user uploaded at least one file
  if (msg.attached_files && msg.attached_files.length > 0) {
    return {
      // display_text = what the user actually typed (may be empty for file-only sends)
      text: msg.display_text || '',
      files: msg.attached_files,
    };
  }

  // ── Legacy / backend-loaded messages: parse the separator markers ─────────
  let text = msg.content || '';
  const files = [];

  if (text.includes('\n\n--- File: ')) {
    const parts = text.split('\n\n--- File: ');
    text = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const filePart = parts[i];
      const nameEnd = filePart.indexOf(' ---\n');
      if (nameEnd !== -1) {
        files.push({ name: filePart.slice(0, nameEnd) });
      }
    }
  }

  return { text, files };
}



// Configure marked
marked.setOptions({ breaks: true, gfm: true });

// Custom renderer to intercept code blocks
const renderer = new marked.Renderer();
renderer.code = (code, lang) => {
  // We'll handle code blocks in React, so return a placeholder
  return `<pre data-code="${encodeURIComponent(code)}" data-lang="${lang || ''}"></pre>`;
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const SKILL_LABELS = {
  qa:       { label: 'Q&A',      color: 'bg-primary-light text-primary border-primary-ring' },
  ship30:   { label: 'Essay',    color: 'bg-secondary-light text-secondary border-secondary-ring' },
  artifact: { label: 'Artifact', color: 'bg-accent-light text-accent border-accent-ring' },
};

function ActionBtn({ icon: Icon, label, onClick, active, activeColor = 'text-primary' }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
        ${active ? `${activeColor} bg-primary-light` : 'text-ink-muted hover:text-ink hover:bg-bg-subtle'}
      `}
    >
      <Icon size={14} />
    </button>
  );
}

function AssistantMessage({ msg, onOpenArtifact }) {
  const { sendMessage, addToast, bookmarks, toggleBookmark } = useAppStore();
  const [liked, setLiked]       = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isSaved = bookmarks.some(b => b.id === msg.id);
  const skill = SKILL_LABELS[msg.skill_used];
  const isStreaming = msg._streaming;


  // Parse markdown + handle code blocks
  const rawHtml = marked.parse(msg.content || '', { renderer });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content || '');
      setCopied(true);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch { addToast('Copy failed', 'error'); }
  };

  const toggleLike = () => { setLiked(v => !v); if (disliked) setDisliked(false); };
  const toggleDislike = () => { setDisliked(v => !v); if (liked) setLiked(false); };

  const regenerate = () => {
    const store = useAppStore.getState();
    const lastUser = [...store.messages].reverse().find(m => m.role === 'user');
    if (lastUser) store.sendMessage(lastUser.content);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-3 group px-4 py-2"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-light border border-primary-ring flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-primary text-xs font-bold">L</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + skill */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-ink">Lenny AI</span>
            {skill && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${skill.color}`}>
                {skill.label}
              </span>
            )}
          </div>

          {/* Bubble */}
          <div className="msg-assistant prose prose-sm max-w-none">
            {!msg.content && isStreaming ? (
              <div className="flex items-center gap-2.5 py-0.5">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="typing-dot"
                      style={{ animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-ink-muted animate-pulse">
                  Thinking…
                </span>
              </div>
            ) : (
              <MarkdownWithCode html={rawHtml} isStreaming={isStreaming} />
            )}
          </div>


          {/* Artifact link button */}
          {msg.artifact_content && (
            <button
              onClick={() => onOpenArtifact({ type: msg.artifact_type, content: msg.artifact_content })}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg hover:bg-accent-light hover:border-accent-ring text-sm text-ink-secondary hover:text-accent transition-all"
            >
              <FileCode2 size={14} />
              View {msg.artifact_type === 'html' ? 'HTML' : 'Markdown'} Artifact
            </button>
          )}

          {/* Action toolbar */}
          {!isStreaming && (
            <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <ActionBtn icon={copied ? Check : Copy} label="Copy" onClick={copy} active={copied} />
              <ActionBtn icon={isSaved ? BookmarkCheck : Bookmark} label={isSaved ? "Saved" : "Save bookmark"} onClick={() => toggleBookmark(msg)} active={isSaved} activeColor="text-amber-500" />
              <ActionBtn icon={ThumbsUp}   label="Good response" onClick={toggleLike}    active={liked}    activeColor="text-secondary" />
              <ActionBtn icon={ThumbsDown} label="Bad response"  onClick={toggleDislike} active={disliked} activeColor="text-danger" />
              <ActionBtn icon={Share2}     label="Share"         onClick={() => setShareOpen(true)} />
              <ActionBtn icon={RotateCcw} label="Regenerate"    onClick={regenerate} />
            </div>
          )}

        </div>
      </motion.div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} content={msg.content || ''} />
    </>
  );
}

// Render markdown HTML but replace <pre data-code> with React CodeBlock
function MarkdownWithCode({ html, isStreaming }) {
  const segments = [];
  let remaining = html;
  const codeRe = /<pre data-code="([^"]*)" data-lang="([^"]*)"><\/pre>/g;
  let lastIdx = 0;
  let m;

  while ((m = codeRe.exec(html)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: 'html', content: html.slice(lastIdx, m.index) });
    }
    segments.push({
      type: 'code',
      code: decodeURIComponent(m[1]),
      lang: m[2],
    });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < html.length) {
    segments.push({ type: 'html', content: html.slice(lastIdx) });
  }

  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === 'code'
          ? <CodeBlock key={i} code={seg.code} lang={seg.lang} />
          : <div
              key={i}
              className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:font-bold prose-strong:text-ink prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: seg.content + (isStreaming && i === segments.length - 1 ? '<span class="cursor-blink"></span>' : '') }}
            />
      )}
    </div>
  );
}

function UserMessage({ msg }) {
  const [copied, setCopied]       = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { text: displayText, files: attachedFiles } = getDisplayContent(msg);
  const [editText, setEditText]   = useState(displayText || '');
  const textareaRef               = useRef(null);
  const { addToast, sendMessage, messages, isStreaming } = useAppStore();

  // Focus + auto-size textarea when entering edit mode
  const startEdit = () => {
    if (isStreaming) return;
    setEditText(displayText || '');
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        autoResize(textareaRef.current);
      }
    }, 30);
  };

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === displayText) { setIsEditing(false); return; }

    // Drop this message + everything after it, then re-send
    const { messages: allMsgs } = useAppStore.getState();
    const msgIndex = allMsgs.findIndex(m => m.id === msg.id);
    if (msgIndex !== -1) {
      useAppStore.setState({ messages: allMsgs.slice(0, msgIndex) });
    }
    setIsEditing(false);
    sendMessage(trimmed);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayText || msg.content || '');
      setCopied(true);
      addToast('Copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch { addToast('Copy failed', 'error'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-3 justify-end group px-4 py-2"
    >
      <div className="flex flex-col items-end gap-1.5 max-w-[75%]">



        {/* Bubble — normal OR editing */}
        {isEditing ? (
          <div className="w-full" style={{ minWidth: 260 }}>
            <div
              className="rounded-[18px_18px_4px_18px] overflow-hidden"
              style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-btn)' }}
            >
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={e => { setEditText(e.target.value); autoResize(e.target); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === 'Escape') cancelEdit();
                }}
                rows={1}
                className="w-full bg-transparent text-white text-sm leading-relaxed px-[18px] py-[12px] resize-none outline-none placeholder-white/60 scrollbar-thin"
                style={{ minHeight: 44, maxHeight: 240 }}
              />
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <button
                onClick={cancelEdit}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-ink-secondary bg-white border border-border hover:bg-bg-subtle transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editText.trim()}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover transition-all disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="msg-user">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachedFiles.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/30"
                  >
                    <Paperclip size={12} />
                    {f.name}
                  </span>
                ))}
              </div>
            )}
            {displayText && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{displayText}</p>
            )}
          </div>
        )}


        {/* Action toolbar (hidden while editing) */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBtn icon={copied ? Check : Copy} label="Copy" onClick={copy} active={copied} />
            <ActionBtn icon={Edit3} label="Edit message" onClick={startEdit} />
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0 mb-0.5">
        <span className="text-white text-xs font-bold">U</span>
      </div>
    </motion.div>
  );
}


export default function MessageBubble({ msg, onOpenArtifact }) {
  if (msg.role === 'user') return <UserMessage msg={msg} />;
  return <AssistantMessage msg={msg} onOpenArtifact={onOpenArtifact} />;
}
