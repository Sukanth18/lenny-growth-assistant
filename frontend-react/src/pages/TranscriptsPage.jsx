import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Sparkles, MessageSquare, ArrowRight,
  Filter, Database, UserCheck, Tag, Zap, CheckCircle2
} from 'lucide-react';
import useAppStore from '../store/appStore';

export default function TranscriptsPage() {
  const { transcripts, loadTranscripts, sendMessage, createNewSession, setPage } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);

  const categories = [
    'All',
    'Product Leadership',
    'Foundership',
    'Product Strategy',
    'Growth & PLG',
    'Operations & Scale',
    'AI & Innovation'
  ];

  const handleAskEpisode = async (prompt) => {
    await createNewSession();
    setPage('chat');
    setTimeout(() => sendMessage(prompt), 100);
  };

  const filtered = transcripts.filter(t => {
    const matchesSearch =
      !search ||
      (t.guest || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.summary || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-bg p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header Banner ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-card p-6 border border-border shadow-card relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary-light rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary border border-primary-ring/60 text-xs font-semibold mb-3">
                <BookOpen size={13} />
                Knowledge Base · Lenny's Podcast Transcripts
              </div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">
                Explore Podcast Transcripts
              </h1>
              <p className="text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
                Browse through indexed transcripts from world-class product leaders, growth practitioners, and founders. Click any episode to ask AI grounded questions.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto bg-bg-subtle/80 p-3 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs text-ink-muted font-medium">Vector Index</p>
                <p className="text-sm font-bold text-ink">420+ Chunks Indexed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Filter Controls ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by guest name, topic, or episode title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white text-ink text-sm pl-9 pr-4 py-2.5 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-ring outline-none transition-all shadow-xs"
            />
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150
                  ${selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'bg-white text-ink-secondary hover:text-ink border border-border hover:bg-bg-subtle'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transcripts Grid ─────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-card p-12 text-center border border-border">
            <BookOpen size={32} className="mx-auto text-ink-muted mb-3 opacity-40" />
            <h3 className="text-base font-bold text-ink">No matching transcripts</h3>
            <p className="text-xs text-ink-muted mt-1">Try clearing your search or selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ep, idx) => (
              <motion.div
                key={ep.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group bg-white rounded-card p-5 border border-border hover:border-primary-ring hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md border border-primary-ring/50">
                      {ep.category || 'Podcast'}
                    </span>
                    <span className="text-[11px] font-medium text-ink-muted flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      RAG Ready
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {ep.guest}
                  </h3>
                  <p className="text-xs font-medium text-ink-secondary mt-0.5 mb-2 line-clamp-1">
                    {ep.title}
                  </p>

                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-4">
                    {ep.summary || 'Deep dive discussion on product strategy, growth mechanics, and execution.'}
                  </p>

                  {ep.topics && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {ep.topics.map((top, tIdx) => (
                        <span key={tIdx} className="text-[10px] font-medium bg-bg-subtle text-ink-secondary px-2 py-0.5 rounded-md">
                          #{top}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAskEpisode(ep.prompt)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-bg-subtle hover:bg-primary hover:text-white text-xs font-bold text-ink transition-all duration-150 group/btn"
                >
                  <Sparkles size={14} className="text-primary group-hover/btn:text-white transition-colors" />
                  Ask AI About This Episode
                  <ArrowRight size={13} className="ml-auto opacity-70 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
