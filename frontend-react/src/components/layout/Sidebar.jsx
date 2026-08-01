import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, LayoutDashboard, Settings, ChevronLeft,
  ChevronRight, Plus, Trash2, BookOpen, Sparkles,
  Zap, ChevronDown, Bookmark, Search
} from 'lucide-react';
import useAppStore from '../../store/appStore';

export default function Sidebar() {
  const {
    sidebarOpen, toggleSidebar, page, setPage,
    sessions, activeSessionId, activateSession, createNewSession,
    setPendingDelete, llmProvider, setLLM, bookmarks
  } = useAppStore();

  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  const llmOptions = [
    { provider: 'ollama',    model: 'llama3.2',                 label: 'Llama 3.2',   badge: 'Local' },
    { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', label: 'Claude Haiku', badge: 'API' },
  ];

  const currentLLM = llmOptions.find(o => o.provider === llmProvider) || llmOptions[0];

  const navRows = [
    { id: 'dashboard font-semibold', page: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
    { id: 'transcripts',             page: 'transcripts', label: 'Transcripts Library', icon: BookOpen,  badge: 'Lenny' },
    { id: 'prompts',                 page: 'prompts',     label: 'Prompt Library',      icon: Zap },
    { id: 'saved',                   page: 'saved',       label: 'Saved Bookmarks',     icon: Bookmark, count: bookmarks.length },
  ];

  const filteredSessions = sessions.filter(s =>
    !chatSearch || (s.title || '').toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 64 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      className="flex-shrink-0 h-full bg-white border-r border-border flex flex-col relative z-20 overflow-hidden"
    >
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-border h-14 flex-shrink-0 ${sidebarOpen ? 'px-4' : 'px-0 justify-center'}`}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0">
              L
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-ink text-sm leading-tight truncate">Lenny AI</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            L
          </div>
        )}
        {sidebarOpen && (
          <button onClick={toggleSidebar} className="btn-icon flex-shrink-0" title="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="btn-icon mx-auto mt-2 mb-1" title="Expand sidebar">
          <ChevronRight size={16} />
        </button>
      )}

      {/* ── New Chat Button ─────────────────────────────────────────────────── */}
      <div className={`px-3 py-3 flex-shrink-0 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        <button
          onClick={createNewSession}
          className={`
            flex items-center gap-2 rounded-xl font-semibold text-sm
            bg-primary text-white hover:bg-primary-hover shadow-btn hover:shadow-btn-hover
            transition-all duration-150 active:scale-[0.98]
            ${sidebarOpen ? 'w-full px-3.5 py-2.5' : 'w-10 h-10 justify-center'}
          `}
          title={!sidebarOpen ? 'New Chat' : ''}
        >
          <Plus size={17} className="flex-shrink-0" />
          {sidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* ── Navigation Rows (ChatGPT style) ─────────────────────────────────── */}
      <div className="px-2 space-y-0.5 flex-shrink-0">
        {navRows.map(row => {
          const Icon = row.icon;
          const active = page === row.page;
          return (
            <button
              key={row.id}
              onClick={() => setPage(row.page)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150
                ${!sidebarOpen ? 'justify-center px-0' : ''}
                ${active
                  ? 'bg-primary-light text-primary font-bold border border-primary-ring/40'
                  : 'text-ink-secondary hover:bg-bg-subtle hover:text-ink'
                }
              `}
              title={!sidebarOpen ? row.label : ''}
            >
              <Icon size={16} className={`flex-shrink-0 ${active ? 'text-primary' : 'text-ink-muted'}`} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">{row.label}</span>
                  {row.badge && (
                    <span className="text-[9.5px] font-bold bg-primary-light text-primary px-1.5 py-0.5 rounded-md border border-primary-ring/50">
                      {row.badge}
                    </span>
                  )}
                  {row.count > 0 && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-200">
                      {row.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-2 mx-3 border-b border-border/80 flex-shrink-0" />

      {/* ── Recent Chats Section Header & Filter ───────────────────────────── */}
      {sidebarOpen && (
        <div className="px-3 py-1 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Recent Chats</span>
          {sessions.length > 5 && (
            <div className="relative flex items-center">
              <Search size={11} className="absolute left-1.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Filter..."
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                className="w-20 bg-bg-subtle text-[11px] pl-5 pr-1 py-0.5 rounded-md outline-none text-ink"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Recent Chats List (Row-wise vertical stack) ────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1 space-y-0.5">
        {sessions.length === 0 ? (
          sidebarOpen && (
            <div className="text-center py-8 px-3">
              <MessageSquare size={20} className="mx-auto text-ink-muted mb-1.5 opacity-50" />
              <p className="text-xs text-ink-muted font-medium">No recent chats</p>
            </div>
          )
        ) : (
          filteredSessions.map(s => {
            const active = page === 'chat' && s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => activateSession(s.id)}
                className={`
                  group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150
                  ${!sidebarOpen ? 'justify-center px-0' : ''}
                  ${active
                    ? 'bg-primary-light text-primary font-semibold border border-primary-ring/50'
                    : 'text-ink-secondary hover:bg-bg-subtle hover:text-ink'
                  }
                `}
                title={!sidebarOpen ? s.title : ''}
              >
                <MessageSquare size={14} className={`flex-shrink-0 ${active ? 'text-primary' : 'text-ink-muted'}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-xs truncate font-medium">{s.title || 'New Chat'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(s.id); }}
                      className="opacity-0 group-hover:opacity-100 btn-icon w-5 h-5 hover:bg-danger-light hover:text-danger transition-all"
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom LLM Model Selector ─────────────────────────────────────── */}
      <div className={`border-t border-border p-3 flex-shrink-0 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        {sidebarOpen ? (
          <div className="relative">
            <button
              onClick={() => setShowLLMDropdown(v => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-bg hover:bg-bg-subtle transition-all text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink truncate">{currentLLM.label}</p>
                <p className="text-[10px] text-ink-muted font-medium">{currentLLM.badge}</p>
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
                  className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-border rounded-2xl shadow-card-hover overflow-hidden z-50 p-1"
                >
                  {llmOptions.map(opt => (
                    <button
                      key={opt.provider}
                      onClick={() => { setLLM(opt.provider, opt.model); setShowLLMDropdown(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all ${opt.provider === llmProvider ? 'bg-primary-light text-primary font-bold' : 'text-ink hover:bg-bg-subtle'}`}
                    >
                      <Sparkles size={13} className={opt.provider === llmProvider ? 'text-primary' : 'text-ink-muted'} />
                      <div className="flex-1">
                        <p className="font-semibold leading-none">{opt.label}</p>
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
            <Sparkles size={16} className="text-primary" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
