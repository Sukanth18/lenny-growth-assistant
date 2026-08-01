import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-2"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary-light border border-primary-ring flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-primary text-xs font-bold">L</span>
      </div>

      {/* Thinking bubble */}
      <div className="flex items-center gap-3 bg-white border border-border rounded-[4px_18px_18px_18px] px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="typing-dot"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: 'var(--color-ink-muted)',
          animation: 'fadeInOut 2s ease-in-out infinite',
        }}>
          Thinking…
        </span>
      </div>
    </motion.div>
  );
}
