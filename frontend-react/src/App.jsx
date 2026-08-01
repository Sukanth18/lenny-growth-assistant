import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';

import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/Chat';
import TranscriptsPage from './pages/TranscriptsPage';
import PromptsPage from './pages/PromptsPage';
import SavedPage from './pages/SavedPage';
import CommandPalette from './components/ui/CommandPalette';
import ToastContainer from './components/ui/Toast';
import Modal from './components/ui/Modal';
import useAppStore from './store/appStore';


export default function App() {
  const {
    page, loadSessions,
    pendingDeleteId, setPendingDelete, deleteSession,
  } = useAppStore();

  const [cmdOpen, setCmdOpen] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // ⌘K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onSearchClick={() => setCmdOpen(true)} />


        {/* Page content */}
        <AnimatePresence mode="wait">
          {page === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <Dashboard />
            </motion.div>
          )}

          {page === 'transcripts' && (
            <motion.div
              key="transcripts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TranscriptsPage />
            </motion.div>
          )}

          {page === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <PromptsPage />
            </motion.div>
          )}

          {page === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <SavedPage />
            </motion.div>
          )}

          {page === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex"
            >
              <ChatPage />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!pendingDeleteId}
        onClose={() => setPendingDelete(null)}
        title="Delete Chat?"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-light border border-danger-ring">
            <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink leading-relaxed">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setPendingDelete(null)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => deleteSession(pendingDeleteId)}
              className="flex items-center gap-2 btn-primary bg-danger hover:bg-red-600"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
