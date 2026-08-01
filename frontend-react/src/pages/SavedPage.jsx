import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Search, Copy, Check, Trash2, Sparkles,
  ArrowRight, FileText, Filter, MessageSquare, Layers
} from 'lucide-react';
import { marked } from 'marked';
import useAppStore from '../store/appStore';

marked.setOptions({ breaks: true, gfm: true });

const SKILL_BADGES = {
  qa:       { label: 'Q&A Insight', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ship30:   { label: 'Essay',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  artifact: { label: 'Artifact',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function SavedPage() {
  const { bookmarks, toggleBookmark, sendMessage, createNewSession, setPage, addToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      addToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('Copy failed', 'error');
    }
  };

  const handleAskFollowUp = async (b) => {
    await createNewSession();
    setPage('chat');
    setTimeout(() => {
      const promptText = `Based on this saved insight:\n\n"${(b.content || '').slice(0, 300)}..."\n\nCan you elaborate further?`;
      sendMessage(promptText);
    }, 100);
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      const matchSearch = !search || (b.content || '').toLowerCase().includes(search.toLowerCase());
      const skillKey = b.skill_used || 'qa';
      const matchFilter = activeFilter === 'all' || skillKey === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [bookmarks, search, activeFilter]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-bg p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-7 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold mb-3">
              <Bookmark size={13} className="text-amber-500" />
              Saved Bookmarks · {bookmarks.length} Insights
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Saved AI Answers
            </h1>
            <p className="text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
              Your personal repository of bookmarked responses, framework summaries, and key insights from Lenny AI.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80 self-start md:self-auto">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search saved bookmarks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-subtle text-ink text-xs pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-amber-400 focus:bg-white outline-none transition-all placeholder:text-ink-muted"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-ink-muted flex items-center gap-1.5 mr-1">
            <Filter size={13} /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Insights', count: bookmarks.length },
            { id: 'qa', label: 'Q&A', count: bookmarks.filter(b => (b.skill_used || 'qa') === 'qa').length },
            { id: 'ship30', label: 'Essays', count: bookmarks.filter(b => b.skill_used === 'ship30').length },
            { id: 'artifact', label: 'Artifacts', count: bookmarks.filter(b => b.skill_used === 'artifact').length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === f.id
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-xs'
                  : 'bg-white text-ink-secondary border border-border hover:bg-bg-subtle hover:text-ink'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === f.id ? 'bg-amber-200/80 text-amber-900' : 'bg-bg-subtle text-ink-muted'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-border shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-3 text-amber-500">
              <Bookmark size={24} />
            </div>
            <h3 className="text-base font-bold text-ink">
              {search || activeFilter !== 'all' ? 'No matching bookmarks' : 'No saved bookmarks yet'}
            </h3>
            <p className="text-xs text-ink-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
              {search || activeFilter !== 'all'
                ? 'Try adjusting your search terms or category filters.'
                : 'Click the bookmark icon on any AI answer during chat to save key takeaways and frameworks here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredBookmarks.map((b, idx) => {
                const skillInfo = SKILL_BADGES[b.skill_used] || SKILL_BADGES.qa;
                const htmlContent = marked.parse(b.content || '');

                return (
                  <motion.div
                    key={b.id || idx}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="bg-white rounded-2xl border border-border hover:border-amber-300 hover:shadow-card transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-5 flex-1 flex flex-col min-w-0">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-border/60">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${skillInfo.color}`}>
                          {skillInfo.label}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(b.id, b.content)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-bg-subtle transition-all"
                            title="Copy text"
                          >
                            {copiedId === b.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => toggleBookmark(b)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Remove bookmark"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Rendered Markdown Body */}
                      <div
                        className="prose prose-sm max-w-none text-ink text-xs leading-relaxed max-h-56 overflow-y-auto scrollbar-thin pr-1 flex-1 font-sans"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-3 bg-bg-subtle/50 border-t border-border/60">
                      <button
                        onClick={() => handleAskFollowUp(b)}
                        className="w-full flex items-center justify-between py-2 px-3.5 rounded-xl bg-white hover:bg-primary hover:text-white border border-border hover:border-primary text-xs font-semibold text-ink-secondary hover:text-white transition-all shadow-2xs group/btn"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles size={13} className="text-primary group-hover/btn:text-white transition-colors" />
                          Ask Follow-up in Chat
                        </span>
                        <ArrowRight size={13} className="opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
