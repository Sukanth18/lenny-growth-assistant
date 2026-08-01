import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import useAppStore from '../../store/appStore';

const EMPTY_PROMPTS = [
  "What growth channels work best for B2B SaaS?",
  "How do top PMs think about prioritization?",
  "Explain retention vs engagement metrics",
  "What are Lenny's top lessons on product-market fit?",
];

export default function MessageList() {
  const { messages, isStreaming, openArtifact, sendMessage, activeSessionId } = useAppStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);



  if (messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onOpenArtifact={openArtifact}
            />
          ))}
        </AnimatePresence>

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );

}
