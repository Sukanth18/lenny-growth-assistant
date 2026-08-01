import { create } from 'zustand';
import { apiGet, apiPost, apiDelete, streamChat } from '../lib/api';

const useAppStore = create((set, get) => ({
  // ── Sessions ──────────────────────────────────────────────────────────────
  sessions: [],
  activeSessionId: null,
  messages: [],

  // ── UI State ──────────────────────────────────────────────────────────────
  page: 'dashboard',            // 'dashboard' | 'chat'
  sidebarOpen: true,
  sidebarTab: 'chats',          // 'chats' | 'transcripts' | 'templates' | 'saved'
  sidebarSearch: '',
  isStreaming: false,
  pendingDeleteId: null,

  // ── Transcripts & Bookmarks ──────────────────────────────────────────────
  transcripts: [],
  totalChunks: 0,
  bookmarks: (() => {
    try { return JSON.parse(localStorage.getItem('lenny_bookmarks') || '[]'); }
    catch { return []; }
  })(),

  // ── LLM ──────────────────────────────────────────────────────────────────
  llmProvider: 'ollama',
  llmModel: 'llama3.2',

  // ── Artifact ─────────────────────────────────────────────────────────────
  artifact: null,               // { type, content } | null
  artifactOpen: false,
  artifactTab: 'preview',       // 'preview' | 'code'

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: [],

  // ── Actions: Transcripts & Bookmarks ──────────────────────────────────────
  loadTranscripts: async () => {
    try {
      const data = await apiGet('/transcripts');
      set({ transcripts: data.episodes || [], totalChunks: data.total_chunks || 0 });
    } catch (e) {
      console.warn('Could not load transcripts:', e);
    }
  },

  toggleBookmark: (msg) => {
    const { bookmarks, addToast } = get();
    const exists = bookmarks.some(b => b.id === msg.id);
    let next;
    if (exists) {
      next = bookmarks.filter(b => b.id !== msg.id);
      addToast('Removed from saved bookmarks', 'info');
    } else {
      next = [{ ...msg, savedAt: new Date().toISOString() }, ...bookmarks];
      addToast('Saved to bookmarks!', 'success');
    }
    localStorage.setItem('lenny_bookmarks', JSON.stringify(next));
    set({ bookmarks: next });
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarSearch: (q) => set({ sidebarSearch: q }),


  // ── Actions: Sessions ─────────────────────────────────────────────────────
  loadSessions: async () => {
    try {
      const sessions = await apiGet('/sessions');
      set({ sessions });
    } catch {
      get().addToast('Cannot connect to backend. Is it running?', 'error');
    }
  },

  createNewSession: async () => {
    const { activeSessionId, messages, llmProvider, llmModel } = get();

    // If we're already on an empty session, just ensure we are on the chat page
    if (activeSessionId && messages.length === 0) {
      set({ page: 'chat', artifact: null, artifactOpen: false });
      return;
    }

    // Instantly switch UI to chat view
    set({ page: 'chat', messages: [], artifact: null, artifactOpen: false });

    try {
      const session = await apiPost('/sessions', {
        title: 'New Chat',
        llm_provider: llmProvider,
        llm_model: llmModel,
      });
      set(s => ({
        sessions: [session, ...s.sessions.filter(x => x.id !== session.id)],
        activeSessionId: session.id,
      }));
    } catch (e) {
      console.error('Failed to create session on backend:', e);
      const fallbackId = crypto.randomUUID();
      const fallbackSession = {
        id: fallbackId,
        title: 'New Chat',
        llm_provider: llmProvider,
        llm_model: llmModel,
        created_at: new Date().toISOString(),
      };
      set(s => ({
        sessions: [fallbackSession, ...s.sessions],
        activeSessionId: fallbackId,
      }));
    }
  },

  activateSession: async (sessionId) => {
    set({ activeSessionId: sessionId, messages: [], artifact: null, artifactOpen: false, page: 'chat' });
    try {
      // Backend returns { ...session, messages: [...] } at GET /sessions/{id}
      const data = await apiGet(`/sessions/${sessionId}`);
      const msgs = data.messages || [];
      // Sort by created_at ascending so oldest first
      msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      set({ messages: msgs });
    } catch (e) {
      console.error('Failed to load messages:', e);
      get().addToast('Failed to load messages', 'error');
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await apiDelete(`/sessions/${sessionId}`);
      const { activeSessionId } = get();
      set(s => ({
        sessions: s.sessions.filter(x => x.id !== sessionId),
        ...(activeSessionId === sessionId ? { activeSessionId: null, messages: [], page: 'dashboard' } : {}),
        pendingDeleteId: null,
      }));
      get().addToast('Chat deleted', 'success');
    } catch {
      get().addToast('Failed to delete session', 'error');
    }
  },

  // ── Actions: Streaming ────────────────────────────────────────────────────
  sendMessage: async (text, displayText = null, attachedFiles = []) => {
    const { activeSessionId, isStreaming, createNewSession } = get();
    if (isStreaming || !text.trim()) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      await createNewSession();
      sessionId = get().activeSessionId;
      if (!sessionId) return;
    }

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      display_text: displayText || null,
      attached_files: attachedFiles,
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg = {
      id: assistantId, role: 'assistant', content: '',
      skill_used: null, artifact_type: null, artifact_content: null,
      _streaming: true,
      _thinking: true,   // true until first text token arrives
    };

    set(s => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isStreaming: true,
    }));

    let streamText = '';
    let artifactContent = '';
    let artifactType = null;

    try {
      await streamChat(sessionId, text, (ev) => {
        if (ev.type === 'thinking') {
          // Backend acknowledged — model is loading; keep _thinking: true
          set(s => ({
            messages: s.messages.map(m => m.id === assistantId ? { ...m, _thinking: true } : m),
          }));
        } else if (ev.type === 'skill') {
          set(s => ({
            messages: s.messages.map(m => m.id === assistantId ? { ...m, skill_used: ev.skill } : m),
          }));
        } else if (ev.type === 'text') {
          streamText += ev.content;
          set(s => ({
            messages: s.messages.map(m => m.id === assistantId
              ? { ...m, content: streamText, _thinking: false }  // first token clears thinking
              : m),
          }));
        } else if (ev.type === 'artifact_start') {
          artifactType = ev.artifact_type;
          set({ artifactOpen: true, artifact: { type: artifactType, content: '', _loading: true } });
        } else if (ev.type === 'artifact_chunk') {
          artifactContent += ev.content;
          set({ artifact: { type: artifactType, content: artifactContent, _loading: false } });
        } else if (ev.type === 'artifact_end') {
          set({ artifact: { type: artifactType, content: artifactContent, _loading: false } });
        } else if (ev.type === 'done') {
          set(s => ({
            messages: s.messages.map(m => m.id === assistantId ? {
              ...m,
              content: streamText,
              artifact_type: artifactType,
              artifact_content: artifactContent || null,
              _streaming: false,
            } : m),
          }));
        } else if (ev.type === 'error') {
          set(s => ({
            messages: s.messages.map(m => m.id === assistantId ? { ...m, content: `Error: ${ev.content}`, _streaming: false } : m),
          }));
        }
      });
    } catch (e) {
      set(s => ({
        messages: s.messages.map(m => m.id === assistantId ? { ...m, content: `Error: ${e.message}`, _streaming: false } : m),
      }));
    } finally {
      set({ isStreaming: false });
      get().loadSessions();
    }
  },

  // ── Actions: Artifact ─────────────────────────────────────────────────────
  openArtifact: (artifact) => set({ artifact, artifactOpen: true, artifactTab: 'preview' }),
  closeArtifact: () => set({ artifactOpen: false }),
  setArtifactTab: (tab) => set({ artifactTab: tab }),

  // ── Actions: UI ───────────────────────────────────────────────────────────
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setPage: (page) => set({ page }),
  setLLM: (provider, model) => set({ llmProvider: provider, llmModel: model }),
  setPendingDelete: (id) => set({ pendingDeleteId: id }),

  // ── Actions: Toast ────────────────────────────────────────────────────────
  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default useAppStore;
