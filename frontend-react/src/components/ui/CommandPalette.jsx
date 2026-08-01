import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, MessageSquare, Plus, Sparkles } from 'lucide-react';
import useAppStore from '../../store/appStore';

export default function CommandPalette({ open, onClose }) {
  const { sessions, activateSession, createNewSession } = useAppStore();
  const inputRef = useRef(null);
  const [query, setQuery] = React.useState('');

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose(); else open === false && onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const filtered = sessions.filter(s => s.title?.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const handleNew = async () => {
    await createNewSession();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-start justify-center pt-24 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white w-full max-w-[540px] rounded-[18px] shadow-[0_32px_80px_rgba(0,0,0,0.18)] overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={16} className="text-ink-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search chats, ask anything…"
                className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted"
              />
              <kbd className="text-xs text-ink-muted bg-bg px-2 py-0.5 rounded-md border border-border font-mono">esc</kbd>
            </div>

            {/* Quick actions */}
            <div className="px-2 py-2 border-b border-border">
              <p className="px-2 py-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Quick Actions</p>
              <button
                onClick={handleNew}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-light text-sm text-ink-secondary hover:text-primary transition-all"
              >
                <Plus size={15} />
                New Chat
              </button>
            </div>

            {/* Sessions */}
            {filtered.length > 0 && (
              <div className="px-2 py-2">
                <p className="px-2 py-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Recent Chats</p>
                {filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { activateSession(s.id); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-subtle text-sm text-ink-secondary hover:text-ink transition-all text-left"
                  >
                    <MessageSquare size={15} className="flex-shrink-0" />
                    <span className="truncate">{s.title || 'New Chat'}</span>
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 && query && (
              <div className="px-4 py-8 text-center">
                <Sparkles size={24} className="mx-auto text-ink-muted mb-2" />
                <p className="text-sm text-ink-secondary">No results for "{query}"</p>
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Command size={11} /> K to open</span>
              <span>↑↓ Navigate</span>
              <span>⏎ Select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
