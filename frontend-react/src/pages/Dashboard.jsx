import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileCode2, BookOpen,
  ArrowRight, TrendingUp, Clock, Zap, Database, CheckCircle2, Flame, Layers
} from 'lucide-react';
import useAppStore from '../store/appStore';

const QUICK_ACTIONS = [
  {
    id: 'qa',
    icon: MessageSquare,
    badge: 'Q&A Mode',
    gradient: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50/80 text-blue-700 border-blue-200/80',
    title: 'Ask a Question',
    desc: 'Instant answers grounded in 500+ Lenny podcast episodes',
    prompt: 'What are the biggest growth mistakes founders make?',
  },
  {
    id: 'essay',
    icon: BookOpen,
    badge: 'Ship30 Essay',
    gradient: 'from-emerald-600 to-teal-600',
    lightBg: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80',
    title: 'Write an Essay',
    desc: 'Synthesize insights into publication-ready long-form essays',
    prompt: 'write an essay about product-market fit for early-stage startups',
  },
  {
    id: 'artifact',
    icon: FileCode2,
    badge: 'Interactive HTML',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50/80 text-amber-700 border-amber-200/80',
    title: 'Generate Artifact',
    desc: 'Build live interactive dashboards, code blocks & framework docs',
    prompt: 'generate an HTML dashboard showing growth framework comparisons',
  },
  {
    id: 'growth',
    icon: TrendingUp,
    badge: 'Deep Strategy',
    gradient: 'from-violet-600 to-purple-600',
    lightBg: 'bg-purple-50/80 text-purple-700 border-purple-200/80',
    title: 'Growth Analysis',
    desc: 'Deep-dive on B2B SaaS channels, metrics & acquisition flywheels',
    prompt: 'What growth channels worked best for B2B SaaS startups according to Lenny?',
  },
];

const SUGGESTED_PROMPTS = [
  { text: 'What growth channels worked best for B2B SaaS?', tag: 'Growth', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { text: 'How do the best PMs think about prioritization?', tag: 'PM', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { text: 'What is the Flywheel Method for scaling a startup?', tag: 'Framework', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { text: 'How do I find product-market fit faster?', tag: 'PMF', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { text: 'What did Lenny learn from interviewing top growth leaders?', tag: 'Leadership', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { text: 'Explain the difference between retention and engagement metrics', tag: 'Metrics', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function Dashboard() {
  const { createNewSession, activateSession, sessions, sendMessage, setPage } = useAppStore();

  const handlePrompt = async (prompt) => {
    await createNewSession();
    setPage('chat');
    setTimeout(() => sendMessage(prompt), 100);
  };

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-bg p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Hero Banner Card ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-bg-card rounded-3xl p-7 md:p-9 border border-border shadow-card"
        >
          {/* Ambient background glow gradient */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-xs font-bold text-indigo-300 mb-4 shadow-xs">
                <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-[9.5px] font-extrabold shadow-2xs">
                  L
                </div>
                <span>Lenny AI · Growth & Product Intelligence</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink mb-3 leading-tight">
                Good morning.{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  What are you building today?
                </span>
              </h1>

              <p className="text-sm md:text-base text-ink-secondary leading-relaxed">
                Ask complex PM questions, synthesize Ship30-style essays, or build interactive HTML artifacts — all strictly grounded in{' '}
                <span className="font-bold text-ink">Lenny Rachitsky's</span> podcast transcripts and newsletter.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex-shrink-0 bg-bg-subtle/80 rounded-2xl p-4 border border-border/60 flex flex-col gap-2.5 min-w-[200px]">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                <Database size={14} className="text-emerald-600" />
                <span>RAG Vector Store</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-ink">
                500+ Episodes Indexed
              </div>
              <div className="text-[11px] text-ink-muted flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> ChromaDB + Nomics Embed
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Action Grid ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Quick Workflows
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePrompt(action.prompt)}
                  className="group relative bg-bg-card rounded-2xl p-5 text-left border border-border hover:border-indigo-500/50 hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Icon + Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${action.gradient} flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${action.lightBg}`}>
                        {action.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-ink mb-1 group-hover:text-indigo-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                      {action.desc}
                    </p>
                  </div>

                  <div className="flex items-center text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Launch</span>
                    <ArrowRight size={13} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Main Content Grid: Prompts + Recent Activity ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Suggested Questions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:col-span-2 bg-bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink">Suggested Growth Questions</h2>
                </div>
                <span className="text-xs text-ink-muted font-medium">Click to ask instantly</span>
              </div>

              <div className="grid gap-2.5">
                {SUGGESTED_PROMPTS.map((item, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => handlePrompt(item.text)}
                    className="group flex items-center justify-between px-4 py-3 rounded-xl border border-border/80 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs text-ink-secondary hover:text-ink transition-all text-left bg-bg-subtle/30"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${item.color}`}>
                        {item.tag}
                      </span>
                      <span className="font-medium truncate">{item.text}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 flex-shrink-0 ml-2" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Recent Activity & System Status */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Recent Chats Card */}
            <div className="bg-bg-card rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center">
                    <Clock size={15} />
                  </div>
                  <h2 className="text-base font-bold text-ink">Recent Chats</h2>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {sessions.length}
                </span>
              </div>

              {recentSessions.length === 0 ? (
                <div className="text-center py-8 bg-bg-subtle/40 rounded-xl border border-border/50">
                  <MessageSquare size={26} className="mx-auto text-ink-muted mb-2 opacity-50" />
                  <p className="text-xs text-ink-muted">No chat history yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentSessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => activateSession(s.id)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 text-left transition-all"
                    >
                      <MessageSquare size={14} className="text-ink-muted group-hover:text-indigo-600 flex-shrink-0" />
                      <span className="flex-1 text-xs font-semibold text-ink-secondary group-hover:text-ink truncate">
                        {s.title || 'New Chat'}
                      </span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Status Card */}
            <div className="bg-bg-card rounded-2xl p-5 border border-border shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold text-ink">Engine Status</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
                </span>
              </div>

              <div className="space-y-2 text-xs text-ink-secondary">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Vector Database</span>
                  <span className="font-semibold text-ink">ChromaDB Local</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Embeddings</span>
                  <span className="font-semibold text-ink">Nomic Embed</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>LLM Pipeline</span>
                  <span className="font-semibold text-ink">Ollama / Claude</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
