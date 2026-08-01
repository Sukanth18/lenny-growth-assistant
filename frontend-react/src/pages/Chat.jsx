import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import MessageList from '../components/chat/MessageList';
import InputComposer from '../components/chat/InputComposer';
import ArtifactPanel from '../components/artifact/ArtifactPanel';
import useAppStore from '../store/appStore';

const EMPTY_PROMPTS = [
  "What growth channels work best for B2B SaaS?",
  "How do top PMs think about prioritization?",
  "Explain retention vs engagement metrics",
  "What are Lenny's top lessons on product-market fit?",
];

export default function ChatPage() {
  const { messages, sendMessage } = useAppStore();
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg">

        {isEmpty ? (
          /* ── New-chat centered layout ─────────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-[720px] flex flex-col items-center text-center"
            >
              {/* Heading */}
              <h2 className="text-xl font-bold text-ink mb-2">What would you like to explore?</h2>
              <p className="text-sm text-ink-secondary mb-8 leading-relaxed">
                Ask questions from Lenny's podcast, generate essays, or build interactive artifacts.
              </p>

              {/* Input box centered */}
              <div className="w-full mb-6">
                <InputComposer />
              </div>

              {/* Suggestion chips */}
              <div className="grid grid-cols-1 gap-2 text-left w-full max-w-md">
                {EMPTY_PROMPTS.map((p, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
                    whileHover={{ x: 4 }}
                    onClick={() => sendMessage(p)}
                    className="group flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary-ring hover:bg-primary-light text-sm text-ink-secondary hover:text-primary transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={14} className="flex-shrink-0" />
                      {p}
                    </div>
                    <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ── Active chat layout ───────────────────────────────────────────── */
          <>
            <MessageList />
            <InputComposer />
          </>
        )}
      </div>

      {/* Artifact panel (slides in from right) */}
      <ArtifactPanel />
    </div>
  );
}
