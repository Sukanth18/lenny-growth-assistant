import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, MessageSquare, FileCode2, BookOpen,
  ArrowRight, TrendingUp, Clock, Zap
} from 'lucide-react';
import useAppStore from '../store/appStore';

const QUICK_ACTIONS = [
  {
    id: 'qa',
    icon: MessageSquare,
    color: 'bg-primary-light text-primary border-primary-ring',
    title: 'Ask a Question',
    desc: "Get insights from Lenny's podcast transcripts",
    prompt: 'What are the biggest growth mistakes founders make?',
  },
  {
    id: 'essay',
    icon: BookOpen,
    color: 'bg-secondary-light text-secondary border-secondary-ring',
    title: 'Write an Essay',
    desc: 'Ship30for30-style long-form content',
    prompt: 'write an essay about product-market fit for early-stage startups',
  },
  {
    id: 'artifact',
    icon: FileCode2,
    color: 'bg-accent-light text-accent border-accent-ring',
    title: 'Generate Artifact',
    desc: 'Create an interactive HTML dashboard or doc',
    prompt: 'generate an HTML dashboard showing growth framework comparisons',
  },
  {
    id: 'growth',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: 'Growth Analysis',
    desc: 'Deep-dive on growth channels and strategies',
    prompt: 'What growth channels worked best for B2B SaaS startups according to Lenny?',
  },
];

const SUGGESTED_PROMPTS = [
  "What growth channels worked best for B2B SaaS?",
  "How do the best PMs think about prioritization?",
  "What is the Flywheel Method for scaling a startup?",
  "How do I find product-market fit faster?",
  "What did Lenny learn from interviewing top growth leaders?",
  "Explain the difference between retention and engagement metrics",
];

export default function Dashboard() {
  const { createNewSession, activateSession, sessions, sendMessage, setPage } = useAppStore();

  const handlePrompt = async (prompt) => {
    await createNewSession();
    setPage('chat');
    // Small delay to let navigation complete
    setTimeout(() => sendMessage(prompt), 100);
  };

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/logo.png"
              alt="Lenny AI"
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover' }}
            />
            <span className="text-sm font-semibold text-ink-secondary">Lenny AI · Growth Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight mb-2">
            Good morning. What are you building today?
          </h1>
          <p className="text-base text-ink-secondary max-w-2xl leading-relaxed">
            Ask questions, generate essays, or build artifacts — all grounded in{' '}
            <span className="font-semibold text-ink">Lenny Rachitsky's</span> podcast insights and newsletter.
          </p>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => handlePrompt(action.prompt)}
                className="card p-5 text-left cursor-pointer transition-all duration-200 hover:border hover:border-border-strong"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${action.color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-bold text-ink mb-1">{action.title}</p>
                <p className="text-xs text-ink-secondary leading-relaxed">{action.desc}</p>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggested Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="lg:col-span-2"
          >
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} className="text-accent" />
                <h2 className="text-sm font-bold text-ink">Suggested Questions</h2>
              </div>
              <div className="grid gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => handlePrompt(prompt)}
                    className="group flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary-ring hover:bg-primary-light text-sm text-ink-secondary hover:text-primary transition-all text-left"
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Chats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
          >
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={16} className="text-ink-muted" />
                <h2 className="text-sm font-bold text-ink">Recent Chats</h2>
              </div>
              {recentSessions.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare size={24} className="mx-auto text-ink-subtle mb-2" />
                  <p className="text-xs text-ink-muted">No chats yet. Start one above!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentSessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => activateSession(s.id)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-bg-subtle text-left transition-all"
                    >
                      <MessageSquare size={14} className="text-ink-muted flex-shrink-0" />
                      <span className="flex-1 text-sm text-ink-secondary group-hover:text-ink truncate">
                        {s.title || 'New Chat'}
                      </span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Usage stats card */}
            <div className="card p-5 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-secondary" />
                <h2 className="text-sm font-bold text-ink">Usage</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-secondary">Chats this week</span>
                    <span className="font-semibold text-ink">{sessions.length}</span>
                  </div>
                  <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(sessions.length * 10, 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-ink-muted">Powered by</span>
                  <span className="text-xs font-semibold text-ink bg-bg-subtle px-2 py-0.5 rounded-md border border-border">
                    Lenny's Transcripts
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
