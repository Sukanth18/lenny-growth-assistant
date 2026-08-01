import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Search, Sparkles, ArrowRight, Copy, Check,
  Target, TrendingUp, BookOpen, FileCode2, Layers
} from 'lucide-react';
import useAppStore from '../store/appStore';

const PROMPT_CATEGORIES = [
  {
    id: 'growth',
    title: '🚀 Growth & Product-Led Growth (PLG)',
    desc: 'Acquisition loops, virality, monetization models, and scaling mechanics.',
    prompts: [
      {
        title: 'Top 3 B2B Growth Loops',
        query: 'What are the top 3 growth loops for B2B SaaS according to Lenny\'s podcast guests?',
        badge: 'Growth'
      },
      {
        title: 'Freemium vs Free Trial Rules',
        query: 'What are Elena Verna\'s exact rules for choosing between Freemium, Free Trial, and Reverse Trial?',
        badge: 'PLG'
      },
      {
        title: 'Measuring Viral Coefficient (k-factor)',
        query: 'Explain how to measure and optimize the viral coefficient (k-factor) and invite loops in B2B apps.',
        badge: 'Virality'
      },
      {
        title: 'Retention vs Engagement Metrics',
        query: 'What is the exact distinction between user engagement metrics and true retention metrics?',
        badge: 'Retention'
      }
    ]
  },
  {
    id: 'strategy',
    title: '🎯 Product Strategy & Leadership',
    desc: 'Frameworks from Shreyas Doshi, Marty Cagan, Brian Chesky, and top leaders.',
    prompts: [
      {
        title: 'Product-Market Fit Signals',
        query: 'How do top product leaders know when a startup has achieved true Product-Market Fit?',
        badge: 'PMF'
      },
      {
        title: 'Empowered Teams vs Feature Factories',
        query: 'How does Marty Cagan distinguish empowered product teams from feature factories in practice?',
        badge: 'Leadership'
      },
      {
        title: 'Shreyas Doshi\'s LNO Framework',
        query: 'Explain Shreyas Doshi\'s LNO (Leverage, Neutral, Overhead) framework for task prioritization.',
        badge: 'Framework'
      },
      {
        title: 'Brian Chesky\'s Founder Mode',
        query: 'Explain Brian Chesky\'s concept of Founder Mode and how it differs from traditional Manager Mode.',
        badge: 'Founders'
      }
    ]
  },
  {
    id: 'essays',
    title: '✍️ Ship30 Essay Generation',
    desc: 'Long-form 1,200+ word structured atomic essays with actionable insights.',
    prompts: [
      {
        title: 'Essay: Scaling Product Teams (10 to 100)',
        query: 'Write a 1,200 word essay on scaling product engineering teams from 10 to 100 people.',
        badge: 'Ship30 Essay'
      },
      {
        title: 'Essay: The Art of Product Discovery',
        query: 'Write a Ship30for30 style essay on continuous customer discovery and validating ideas fast.',
        badge: 'Ship30 Essay'
      }
    ]
  },
  {
    id: 'artifacts',
    title: '💻 Interactive Artifact Generation',
    desc: 'Generate live rendering HTML/CSS UI components, dashboards, and specs.',
    prompts: [
      {
        title: 'HTML SaaS Metrics Dashboard',
        query: 'Generate an HTML/CSS dashboard showing SaaS MRR, Churn, ARPU, and CAC payback period metrics.',
        badge: 'HTML Artifact'
      },
      {
        title: 'Markdown PRD Spec Template',
        query: 'Generate a comprehensive markdown Product Requirement Document (PRD) template with user stories.',
        badge: 'Markdown'
      }
    ]
  }
];

export default function PromptsPage() {
  const { sendMessage, createNewSession, setPage, addToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleRunPrompt = async (query) => {
    await createNewSession();
    setPage('chat');
    setTimeout(() => sendMessage(query), 100);
  };

  const handleCopyPrompt = async (idx, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      addToast('Prompt copied to clipboard!', 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      addToast('Copy failed', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-bg p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-card p-6 border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold mb-3">
              <Zap size={13} className="text-amber-500" />
              Prompt Library · Curated Growth & PM Prompts
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Prompt Library
            </h1>
            <p className="text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
              Launch pre-engineered prompts tailored for product management, growth strategies, Ship30 essays, and live code artifacts.
            </p>
          </div>

          <div className="relative w-full md:w-72 self-start md:self-auto">
            <Search size={15} className="absolute left-3 text-ink-muted" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-subtle text-ink text-xs pl-9 pr-3 py-2.5 rounded-xl border border-transparent focus:border-amber-400 focus:bg-white outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* Prompt Categories */}
        <div className="space-y-6">
          {PROMPT_CATEGORIES.map((cat) => {
            const matchingPrompts = cat.prompts.filter(p =>
              !search ||
              p.title.toLowerCase().includes(search.toLowerCase()) ||
              p.query.toLowerCase().includes(search.toLowerCase())
            );

            if (matchingPrompts.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-3">
                <div>
                  <h2 className="text-base font-bold text-ink">{cat.title}</h2>
                  <p className="text-xs text-ink-muted">{cat.desc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {matchingPrompts.map((p, pIdx) => {
                    const uniqueId = `${cat.id}-${pIdx}`;
                    return (
                      <motion.div
                        key={uniqueId}
                        whileHover={{ y: -2 }}
                        className="bg-white rounded-card p-4 border border-border hover:border-amber-300 hover:shadow-card transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md border border-amber-200">
                              {p.badge}
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(uniqueId, p.query)}
                              className="btn-icon w-6 h-6 text-ink-muted hover:text-ink"
                              title="Copy prompt text"
                            >
                              {copiedIndex === uniqueId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-ink mb-1">{p.title}</h3>
                          <p className="text-xs text-ink-secondary leading-relaxed bg-bg-subtle/50 p-2.5 rounded-xl border border-border/50 mb-3 font-mono">
                            "{p.query}"
                          </p>
                        </div>

                        <button
                          onClick={() => handleRunPrompt(p.query)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all shadow-xs"
                        >
                          <Sparkles size={13} />
                          Run Prompt in Chat
                          <ArrowRight size={13} className="ml-auto opacity-80" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
