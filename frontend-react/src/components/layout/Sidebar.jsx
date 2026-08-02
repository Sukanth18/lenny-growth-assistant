import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, LayoutDashboard, ChevronLeft, ChevronRight,
  Plus, Trash2, BookOpen, Sparkles, Zap, ChevronDown, Bookmark,
  Pin, PinOff, MoreHorizontal, Edit3, Check, X
} from 'lucide-react';
import useAppStore from '../../store/appStore';

// ── Single Chat Item Component with Hover Actions & 3-Dots Menu ───────────────
function ChatItem({ session, active, sidebarOpen, isPinned }) {
  const { activateSession, togglePinSession, renameSession, setPendingDelete, deleteSession } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title || 'New Chat');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSaveRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      renameSession(session.id, editTitle.trim());
    }
    setIsEditing(false);
    setMenuOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') {
      setEditTitle(session.title || 'New Chat');
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={() => !isEditing && activateSession(session.id)}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150
        ${!sidebarOpen ? 'justify-center px-0' : ''}
        ${active
          ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
          : 'text-ink-secondary hover:bg-bg-subtle hover:text-ink'
        }
      `}
      title={!sidebarOpen ? session.title || 'New Chat' : ''}
    >
      <MessageSquare
        size={14}
        className={`flex-shrink-0 ${active ? 'text-indigo-600' : 'text-ink-muted'}`}
      />

      {sidebarOpen && (
        <>
          {/* Title or Inline Edit Input */}
          <div className="flex-1 min-w-0 pr-1">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-xs bg-white text-ink border border-indigo-400 rounded-md px-1.5 py-0.5 outline-none font-medium shadow-xs"
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  title="Save"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-ink-muted hover:bg-bg-hover rounded"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className={`text-xs font-medium block leading-snug truncate transition-all ${isPinned ? 'pr-6' : 'group-hover:pr-12'}`}>
                {session.title || 'New Chat'}
              </span>
            )}
          </div>

          {/* Right Action Icons: 1) Pin, 2) 3 Dots Menu */}
          {!isEditing && (
            <div
              className={`
                absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1 py-0.5 rounded-lg
                ${active ? 'bg-indigo-950/80' : 'bg-[#181D2B]'} shadow-2xs transition-all duration-150
                ${isPinned || menuOpen ? 'opacity-100 z-30' : 'opacity-0 group-hover:opacity-100 z-20'}
              `}
              onClick={e => e.stopPropagation()}
            >
              {/* Pin / Unpin Button */}
              <button
                onClick={() => togglePinSession(session.id)}
                className={`p-1 rounded-md transition-all ${
                  isPinned
                    ? 'text-indigo-600 opacity-100 hover:bg-indigo-100/60'
                    : 'text-ink-muted hover:text-ink hover:bg-bg-hover'
                }`}
                title={isPinned ? 'Unpin chat' : 'Pin chat to top'}
              >
                <Pin size={13} className={isPinned ? 'fill-indigo-600/20' : ''} />
              </button>

              {/* 3 Dots Menu Trigger */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className={`p-1 rounded-md transition-all ${
                    menuOpen
                      ? 'text-ink bg-bg-hover opacity-100'
                      : 'text-ink-muted hover:text-ink hover:bg-bg-hover'
                  }`}
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* 3 Dots Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 2 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 2 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-full mt-1.5 w-32 bg-[#181D2B] rounded-xl border border-border/80 shadow-2xl p-1 z-[100] overflow-hidden"
                    >
                      <button
                        onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-ink-secondary hover:text-ink hover:bg-bg-subtle transition-all font-medium text-left"
                      >
                        <Edit3 size={13} className="text-ink-muted" />
                        <span>Rename</span>
                      </button>

                      <button
                        onClick={() => { togglePinSession(session.id); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-ink-secondary hover:text-ink hover:bg-bg-subtle transition-all font-medium text-left"
                      >
                        {isPinned ? <PinOff size={13} className="text-ink-muted" /> : <Pin size={13} className="text-ink-muted" />}
                        <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      <div className="my-1 border-t border-border/60" />

                      <button
                        onClick={() => { setPendingDelete(session.id); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 transition-all font-medium text-left"
                      >
                        <Trash2 size={13} className="text-red-400" />
                        <span>Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sidebar Main Component ───────────────────────────────────────────────────
export default function Sidebar() {
  const {
    sidebarOpen, toggleSidebar, page, setPage,
    sessions, activeSessionId, createNewSession,
    llmProvider, setLLM, bookmarks, pinnedSessionIds
  } = useAppStore();

  const [showLLMDropdown, setShowLLMDropdown] = useState(false);

  const llmOptions = [
    { provider: 'ollama',    model: 'llama3.2',                 label: 'Llama 3.2',   badge: 'Local (Offline)' },
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', label: 'Claude Haiku', badge: 'Cloud API' },
  ];

  const currentLLM = llmOptions.find(o => o.provider === llmProvider) || llmOptions[0];

  const navRows = [
    { id: 'dashboard',   page: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
    { id: 'transcripts', page: 'transcripts', label: 'Transcripts Library', icon: BookOpen,  badge: 'Lenny' },
    { id: 'prompts',     page: 'prompts',     label: 'Prompt Library',      icon: Zap },
    { id: 'saved',       page: 'saved',       label: 'Saved Bookmarks',     icon: Bookmark, count: bookmarks.length },
  ];

  // Separate pinned and unpinned sessions
  const pinnedSessions = sessions.filter(s => pinnedSessionIds.includes(s.id));
  const unpinnedSessions = sessions.filter(s => !pinnedSessionIds.includes(s.id));

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      className="flex-shrink-0 h-full bg-bg-card border-r border-border flex flex-col relative z-20 overflow-hidden shadow-xs"
    >
      {/* ── Top Brand Header ─────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-border/60 h-14 flex-shrink-0 ${sidebarOpen ? 'px-4' : 'px-0 justify-center'}`}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-sm flex-shrink-0 text-sm">
              L
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-ink text-sm leading-tight truncate">Lenny AI</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-sm text-sm">
            L
          </div>
        )}
        {sidebarOpen && (
          <button onClick={toggleSidebar} className="btn-icon flex-shrink-0 text-ink-muted hover:text-ink" title="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="btn-icon mx-auto mt-2 mb-1 text-ink-muted hover:text-ink" title="Expand sidebar">
          <ChevronRight size={16} />
        </button>
      )}

      {/* ── New Chat Primary Action ─────────────────────────────────────────── */}
      <div className={`px-3 py-3 flex-shrink-0 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        <button
          onClick={createNewSession}
          className={`
            flex items-center gap-2 rounded-xl font-bold text-xs tracking-wide
            bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white
            hover:opacity-95 shadow-sm hover:shadow-md
            transition-all duration-150 active:scale-[0.98]
            ${sidebarOpen ? 'w-full px-4 py-2.5 justify-center' : 'w-10 h-10 justify-center'}
          `}
          title={!sidebarOpen ? 'New Chat' : ''}
        >
          <Plus size={16} className="flex-shrink-0" />
          {sidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* ── Main Navigation Links ───────────────────────────────────────────── */}
      <div className="px-2.5 space-y-1 flex-shrink-0">
        {navRows.map(row => {
          const Icon = row.icon;
          const active = page === row.page;
          return (
            <button
              key={row.id}
              onClick={() => setPage(row.page)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold
                transition-all duration-150 relative group
                ${!sidebarOpen ? 'justify-center px-0' : ''}
                ${active
                  ? 'bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                  : 'text-ink-secondary hover:bg-bg-subtle hover:text-ink'
                }
              `}
              title={!sidebarOpen ? row.label : ''}
            >
              <Icon size={16} className={`flex-shrink-0 ${active ? 'text-indigo-600' : 'text-ink-muted group-hover:text-ink'}`} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">{row.label}</span>
                  {row.badge && (
                    <span className="text-[9.5px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200">
                      {row.badge}
                    </span>
                  )}
                  {row.count > 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                      {row.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-2.5 mx-3 border-b border-border/60 flex-shrink-0" />

      {/* ── Chats Section Header (Filter removed as requested) ────────────────── */}
      {sidebarOpen && (
        <div className="px-3 py-1 flex items-center justify-between flex-shrink-0 mb-1">
          <span className="text-[11px] font-bold text-ink-secondary tracking-tight">Chats</span>
        </div>
      )}

      {/* ── Chats Scrollable Stack (Pinned + Unpinned) ────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-0.5 space-y-0.5">
        {sessions.length === 0 ? (
          sidebarOpen && (
            <div className="text-center py-6 px-3">
              <MessageSquare size={18} className="mx-auto text-ink-muted mb-1 opacity-40" />
              <p className="text-[11px] text-ink-muted font-medium">No recent chats</p>
            </div>
          )
        ) : (
          <>
            {/* Pinned Chats */}
            {pinnedSessions.map(s => (
              <ChatItem
                key={s.id}
                session={s}
                active={page === 'chat' && s.id === activeSessionId}
                sidebarOpen={sidebarOpen}
                isPinned={true}
              />
            ))}

            {/* Separator if both pinned and unpinned exist */}
            {pinnedSessions.length > 0 && unpinnedSessions.length > 0 && (
              <div className="my-1 border-b border-border/40" />
            )}

            {/* Unpinned Chats */}
            {unpinnedSessions.map(s => (
              <ChatItem
                key={s.id}
                session={s}
                active={page === 'chat' && s.id === activeSessionId}
                sidebarOpen={sidebarOpen}
                isPinned={false}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Bottom LLM Model Switcher Selector ───────────────────────────────── */}
      <div className={`border-t border-border/60 p-3 flex-shrink-0 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        {sidebarOpen ? (
          <div className="relative">
            <button
              onClick={() => setShowLLMDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border/80 bg-bg-subtle/50 hover:bg-bg-subtle transition-all text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink truncate">{currentLLM.label}</p>
                <p className="text-[10px] text-ink-muted font-medium truncate">{currentLLM.badge}</p>
              </div>
              <ChevronDown size={13} className="text-ink-muted flex-shrink-0" />
            </button>

            <AnimatePresence>
              {showLLMDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-[#181D2B] border border-border rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5"
                >
                  {llmOptions.map(opt => (
                    <button
                      key={opt.provider}
                      onClick={() => { setLLM(opt.provider, opt.model); setShowLLMDropdown(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${opt.provider === llmProvider ? 'bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-500/30' : 'text-ink hover:bg-bg-subtle'}`}
                    >
                      <Sparkles size={13} className={opt.provider === llmProvider ? 'text-indigo-400' : 'text-ink-muted'} />
                      <div className="flex-1">
                        <p className="font-semibold leading-none text-ink">{opt.label}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">{opt.badge}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button className="btn-icon" title="AI Model">
            <Sparkles size={16} className="text-indigo-600" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
