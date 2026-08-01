/**
 * Lenny Growth Assistant — Frontend Application
 * 
 * Architecture:
 *  - State management: plain JS object (no framework needed)
 *  - Chat streaming: EventSource API (SSE)
 *  - Artifact parsing: stream state machine
 *  - Markdown: marked.js (CDN)
 *  - Syntax highlighting: Prism.js (CDN)
 */

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  sessions:          [],           // { id, title, llm_provider, llm_model }
  activeSessionId:   null,
  messages:          [],           // { id, role, content, skill_used, artifact_type, artifact_content }
  isStreaming:       false,
  currentArtifact:   null,         // { type: 'html'|'markdown', content: string }
  pendingDeleteId:   null,
  llmProvider:       'ollama',
  llmModel:          'llama3.2',
};

// ── DOM References ────────────────────────────────────────────────────────────
const DOM = {
  sessionList:       document.getElementById('session-list'),
  btnNewChat:        document.getElementById('btn-new-chat'),
  emptyState:        document.getElementById('empty-state'),
  messagesContainer: document.getElementById('messages-container'),
  chatInput:         document.getElementById('chat-input'),
  sendBtn:           document.getElementById('send-btn'),
  charCount:         document.getElementById('char-count'),
  skillHint:         document.getElementById('skill-hint'),
  artifactPanel:     document.getElementById('artifact-panel'),
  artifactTitle:     document.getElementById('artifact-title'),
  artifactIcon:      document.getElementById('artifact-icon'),
  artifactTypeBadge: document.getElementById('artifact-type-badge'),
  artifactMarkdown:  document.getElementById('artifact-markdown-view'),
  artifactIframe:    document.getElementById('artifact-iframe'),
  artifactSkeleton:  document.getElementById('artifact-skeleton'),
  artifactCodeBlock: document.getElementById('artifact-code-block'),
  artifactPreviewPane: document.getElementById('artifact-preview-pane'),
  artifactCodePane:  document.getElementById('artifact-code-pane'),
  tabPreview:        document.getElementById('tab-preview'),
  tabCode:           document.getElementById('tab-code'),
  btnCopyArtifact:   document.getElementById('btn-copy-artifact'),
  btnCloseArtifact:  document.getElementById('btn-close-artifact'),
  modalOverlay:      document.getElementById('modal-overlay'),
  btnModalCancel:    document.getElementById('btn-modal-cancel'),
  btnModalConfirm:   document.getElementById('btn-modal-confirm'),
  modelBadge:        document.getElementById('model-badge'),
  pillOllama:        document.getElementById('pill-ollama'),
  pillAnthropic:     document.getElementById('pill-anthropic'),
  toast:             document.getElementById('toast'),
  btnCloseSidebar:   document.getElementById('btn-close-sidebar'),
  btnOpenSidebar:    document.getElementById('btn-open-sidebar'),
};

// ── Marked.js Config ──────────────────────────────────────────────────────────
marked.setOptions({
  breaks:   true,
  gfm:      true,
  headerIds: false,
  mangle:   false,
});

// ── API Helpers ───────────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`API error ${res.status}`);
}

async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Session Management ────────────────────────────────────────────────────────
async function loadSessions() {
  try {
    state.sessions = await apiGet('/sessions');
    renderSessionList();
  } catch (e) {
    console.error('Failed to load sessions:', e);
    showToast('Cannot connect to backend. Is it running?', 'error');
  }
}

async function createNewSession() {
  // Guard: if the currently active session is still empty (no messages), just
  // switch focus to it instead of creating yet another blank session.
  if (state.activeSessionId) {
    const current = state.sessions.find(s => s.id === state.activeSessionId);
    if (current && state.messages.length === 0) {
      // Already on a fresh empty chat — do nothing
      return;
    }
  }

  try {
    const session = await apiPost('/sessions', {
      title:        'New Chat',
      llm_provider: state.llmProvider,
      llm_model:    state.llmModel,
    });
    state.sessions.unshift(session);
    renderSessionList();
    await activateSession(session.id);
  } catch (e) {
    showToast('Failed to create session', 'error');
  }
}

async function activateSession(sessionId) {
  state.activeSessionId = sessionId;
  state.messages = [];
  closeArtifactPanel();

  try {
    const session = await apiGet(`/sessions/${sessionId}`);
    state.messages = session.messages || [];
    renderMessages();
    renderSessionList();
  } catch (e) {
    showToast('Failed to load session', 'error');
  }
}

async function deleteSession(sessionId) {
  try {
    await apiDelete(`/sessions/${sessionId}`);
    state.sessions = state.sessions.filter(s => s.id !== sessionId);
    if (state.activeSessionId === sessionId) {
      state.activeSessionId = null;
      state.messages = [];
      renderMessages();
    }
    renderSessionList();
    showToast('Chat deleted', 'success');
  } catch (e) {
    showToast('Failed to delete session', 'error');
  }
}

// ── Session Render ────────────────────────────────────────────────────────────
function renderSessionList() {
  if (state.sessions.length === 0) {
    DOM.sessionList.innerHTML = `
      <div class="session-empty">
        No conversations yet.<br/>Click "+ New Chat" to start.
      </div>`;
    return;
  }

  DOM.sessionList.innerHTML = state.sessions.map(s => `
    <div class="session-item ${s.id === state.activeSessionId ? 'active' : ''}"
         role="listitem"
         data-session-id="${s.id}">
      <span class="session-icon">💬</span>
      <span class="session-title" title="${escHtml(s.title)}">${escHtml(s.title)}</span>
      <button class="session-delete" data-delete-id="${s.id}" aria-label="Delete session">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        </svg>
      </button>
    </div>
  `).join('');

  // Attach events
  DOM.sessionList.querySelectorAll('.session-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.session-delete')) return;
      activateSession(el.dataset.sessionId);
    });
  });

  DOM.sessionList.querySelectorAll('.session-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.pendingDeleteId = btn.dataset.deleteId;
      DOM.modalOverlay.hidden = false;
    });
  });
}

// ── Message Render ────────────────────────────────────────────────────────────
function renderMessages() {
  const hasMessages = state.messages.length > 0;
  DOM.emptyState.style.display = hasMessages ? 'none' : '';

  if (!hasMessages) {
    DOM.messagesContainer.innerHTML = '';
    return;
  }

  DOM.messagesContainer.innerHTML = state.messages.map(m => renderMessageHTML(m)).join('');
  scrollToBottom();
}

function renderMessageHTML(msg) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return `
      <div class="message-row user" data-msg-id="${msg.id}">
        <div class="user-message-container">
          <div class="message-bubble">
            <div class="msg-text">${escHtml(msg.content)}</div>
          </div>
          <div class="message-toolbar">
            <button class="btn-icon-action btn-copy-msg" data-msg-id="${msg.id}" title="Copy prompt" aria-label="Copy prompt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon-action btn-edit-msg" data-msg-id="${msg.id}" title="Edit message" aria-label="Edit message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  return renderAssistantMessage(msg);
}

function renderAssistantMessage(msg) {
  const skillBadge = msg.skill_used
    ? `<div class="skill-badge ${msg.skill_used}">${skillLabel(msg.skill_used)}</div>`
    : '';

  const artifactBtn = msg.artifact_content
    ? `<button class="artifact-link-btn" data-msg-id="${msg.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
        </svg>
        View ${msg.artifact_type === 'html' ? 'HTML' : 'Markdown'} Artifact
      </button>`
    : '';

  const contentHtml = marked.parse(msg.content || '');

  return `
    <div class="message-row assistant" data-msg-id="${msg.id}">
      <div class="message-bubble">
        ${skillBadge}
        <div class="msg-content">${contentHtml}</div>
        <div class="msg-footer-bar">
          ${artifactBtn}
          <div class="message-toolbar">
            <button class="btn-icon-action btn-copy-msg" data-msg-id="${msg.id}" title="Copy" aria-label="Copy response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon-action btn-thumbs-up" data-msg-id="${msg.id}" title="Good response" aria-label="Good response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </button>
            <button class="btn-icon-action btn-thumbs-down" data-msg-id="${msg.id}" title="Bad response" aria-label="Bad response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
              </svg>
            </button>
            <button class="btn-icon-action btn-share-msg" data-msg-id="${msg.id}" title="Share" aria-label="Share response">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function skillLabel(skill) {
  return { qa: '🔍 Q&A', ship30: '✍️ Essay', artifact: '🖼️ Artifact' }[skill] || skill;
}

// ── Streaming Chat ────────────────────────────────────────────────────────────
async function sendMessage(text) {
  if (state.isStreaming || !text.trim()) return;

  // Ensure we have a session
  if (!state.activeSessionId) {
    await createNewSession();
    if (!state.activeSessionId) return;
  }

  state.isStreaming = true;
  setInputDisabled(true);

  // Optimistically add user message
  const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
  state.messages.push(userMsg);
  DOM.emptyState.style.display = 'none';

  // Add placeholder assistant message
  const assistantId = crypto.randomUUID();
  const assistantMsg = {
    id: assistantId, role: 'assistant', content: '',
    skill_used: null, artifact_type: null, artifact_content: null,
    _streaming: true,
  };
  state.messages.push(assistantMsg);
  renderMessages();

  // Get ref to streaming bubble
  const bubbles = DOM.messagesContainer.querySelectorAll('.message-row.assistant .message-bubble');
  const streamingBubble = bubbles[bubbles.length - 1];
  const contentEl = streamingBubble.querySelector('.msg-content');
  let skillBadgeEl = null;

  // Stream SSE
  const streamingText = { text: '', artifactType: null, artifactContent: '' };
  let artifactStreaming = false;
  let artifactStarted   = false;

  try {
    const response = await fetch(`${API_BASE}/sessions/${state.activeSessionId}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Server error: ${err}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let ev;
        try { ev = JSON.parse(raw); } catch { continue; }

        if (ev.type === 'skill') {
          assistantMsg.skill_used = ev.skill;
          const badge = document.createElement('div');
          badge.className = `skill-badge ${ev.skill}`;
          badge.textContent = skillLabel(ev.skill);
          streamingBubble.insertBefore(badge, contentEl);
          skillBadgeEl = badge;

        } else if (ev.type === 'text') {
          streamingText.text += ev.content;
          contentEl.innerHTML = marked.parse(streamingText.text) +
            '<span class="cursor-blink"></span>';
          scrollToBottom();

        } else if (ev.type === 'artifact_start') {
          streamingText.artifactType = ev.artifact_type;
          artifactStreaming = true;
          if (!artifactStarted) {
            artifactStarted = true;
            showArtifactSkeleton(ev.artifact_type);
          }

        } else if (ev.type === 'artifact_chunk') {
          streamingText.artifactContent += ev.content;
          updateArtifactStream(streamingText.artifactContent, streamingText.artifactType);

        } else if (ev.type === 'artifact_end') {
          artifactStreaming = false;
          finalizeArtifact(streamingText.artifactContent, streamingText.artifactType);

        } else if (ev.type === 'done') {
          assistantMsg.content          = streamingText.text;
          assistantMsg.artifact_type    = streamingText.artifactType;
          assistantMsg.artifact_content = streamingText.artifactContent || null;
          assistantMsg._streaming       = false;

          renderMessages();

        } else if (ev.type === 'error') {
          contentEl.innerHTML = `<span style="color:var(--danger)">⚠️ ${escHtml(ev.content)}</span>`;
        }
      }
    }

  } catch (e) {
    contentEl.innerHTML = `<span style="color:var(--danger)">⚠️ ${escHtml(e.message)}</span>`;
    console.error('Stream error:', e);
  } finally {
    state.isStreaming = false;
    setInputDisabled(false);
    DOM.chatInput.focus();
    scrollToBottom();

    // Refresh session list to get updated title
    await loadSessions();
  }
}

// ── Artifact Viewer ───────────────────────────────────────────────────────────
function showArtifactSkeleton(type) {
  DOM.artifactPanel.hidden = false;
  DOM.artifactIcon.textContent     = type === 'html' ? '🌐' : '📄';
  DOM.artifactTitle.textContent    = type === 'html' ? 'HTML Artifact' : 'Markdown Document';
  DOM.artifactTypeBadge.textContent = type.toUpperCase();

  // Show skeleton
  DOM.artifactSkeleton.hidden    = false;
  DOM.artifactMarkdown.hidden    = true;
  DOM.artifactIframe.hidden      = true;
  DOM.artifactCodePane.hidden    = true;
  DOM.artifactPreviewPane.hidden = false;
}

function updateArtifactStream(content, type) {
  // Hide skeleton once content starts arriving
  DOM.artifactSkeleton.hidden = true;

  if (type === 'markdown') {
    DOM.artifactMarkdown.hidden = false;
    DOM.artifactMarkdown.innerHTML = marked.parse(content);
  }
  // For HTML, wait until complete to render in iframe
}

function finalizeArtifact(content, type) {
  state.currentArtifact = { type, content };
  DOM.artifactSkeleton.hidden = true;

  if (type === 'html') {
    DOM.artifactIframe.hidden = false;
    DOM.artifactMarkdown.hidden = true;
    DOM.artifactIframe.srcdoc = content;
  } else {
    DOM.artifactMarkdown.hidden = false;
    DOM.artifactIframe.hidden = true;
    DOM.artifactMarkdown.innerHTML = marked.parse(content);
  }

  // Update code tab
  DOM.artifactCodeBlock.textContent = content;
  try { Prism.highlightElement(DOM.artifactCodeBlock); } catch (_) {}
}

function showArtifact({ type, content }) {
  state.currentArtifact = { type, content };
  DOM.artifactPanel.hidden = false;
  DOM.artifactIcon.textContent      = type === 'html' ? '🌐' : '📄';
  DOM.artifactTitle.textContent     = type === 'html' ? 'HTML Artifact' : 'Markdown Document';
  DOM.artifactTypeBadge.textContent = type.toUpperCase();
  DOM.artifactSkeleton.hidden       = true;
  DOM.artifactPreviewPane.hidden    = false;
  DOM.artifactCodePane.hidden       = true;

  if (type === 'html') {
    DOM.artifactIframe.hidden    = false;
    DOM.artifactMarkdown.hidden  = true;
    DOM.artifactIframe.srcdoc    = content;
  } else {
    DOM.artifactMarkdown.hidden  = false;
    DOM.artifactIframe.hidden    = true;
    DOM.artifactMarkdown.innerHTML = marked.parse(content);
  }

  DOM.artifactCodeBlock.textContent = content;
  try { Prism.highlightElement(DOM.artifactCodeBlock); } catch (_) {}

  // Activate preview tab
  switchArtifactTab('preview');
}

function closeArtifactPanel() {
  DOM.artifactPanel.hidden = true;
  state.currentArtifact   = null;
}

function switchArtifactTab(tab) {
  const isPreview = tab === 'preview';
  DOM.tabPreview.classList.toggle('active', isPreview);
  DOM.tabCode.classList.toggle('active', !isPreview);
  DOM.tabPreview.setAttribute('aria-selected', String(isPreview));
  DOM.tabCode.setAttribute('aria-selected', String(!isPreview));
  DOM.artifactPreviewPane.hidden = !isPreview;
  DOM.artifactCodePane.hidden    = isPreview;
}

// ── LLM Toggle ────────────────────────────────────────────────────────────────
async function switchLLMProvider(provider, model) {
  try {
    await apiPatch('/config', { provider, model });
    state.llmProvider = provider;
    state.llmModel    = model;

    DOM.pillOllama.classList.toggle('active', provider === 'ollama');
    DOM.pillAnthropic.classList.toggle('active', provider === 'anthropic');
    DOM.modelBadge.textContent = model;

    showToast(`Switched to ${provider === 'anthropic' ? 'Claude' : 'Ollama'} (${model})`, 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function scrollToBottom() {
  DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
}

function setInputDisabled(disabled) {
  DOM.chatInput.disabled = disabled;
  DOM.sendBtn.disabled   = disabled;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) resolve();
        else reject(new Error('Copy command failed'));
      } catch (err) {
        document.body.removeChild(textArea);
        reject(err);
      }
    });
  }
}

let _toastTimer;
function showToast(msg, type = '') {
  DOM.toast.textContent = msg;
  DOM.toast.className   = `toast ${type}`;
  DOM.toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

// ── Event Listeners ───────────────────────────────────────────────────────────
DOM.btnNewChat.addEventListener('click', createNewSession);

// Messages container action delegation (Copy, Edit, Share, Artifact link)
DOM.messagesContainer.addEventListener('click', (e) => {
  // Artifact link button
  const artifactBtn = e.target.closest('.artifact-link-btn');
  if (artifactBtn) {
    const msgId = artifactBtn.dataset.msgId;
    const msg   = state.messages.find(m => m.id === msgId);
    if (msg && msg.artifact_content) {
      showArtifact({ type: msg.artifact_type, content: msg.artifact_content });
    }
    return;
  }

  // Copy message button
  const copyBtn = e.target.closest('.btn-copy-msg');
  if (copyBtn) {
    const msgId = copyBtn.dataset.msgId;
    const msg   = state.messages.find(m => m.id === msgId);
    if (msg && msg.content) {
      copyTextToClipboard(msg.content).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;
        copyBtn.classList.add('copied');
        showToast('Copied to clipboard!', 'success');
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        showToast('Failed to copy text', 'error');
      });
    }
    return;
  }

  // Share message button
  const shareBtn = e.target.closest('.btn-share-msg');
  if (shareBtn) {
    const msgId = shareBtn.dataset.msgId;
    const msg   = state.messages.find(m => m.id === msgId);
    if (msg && msg.content) openShareModal(msg.content);
    return;
  }

  // Thumbs up button
  const thumbsUpBtn = e.target.closest('.btn-thumbs-up');
  if (thumbsUpBtn) {
    const isLiked = thumbsUpBtn.classList.toggle('active-good');
    const thumbsDownBtn = thumbsUpBtn.parentElement.querySelector('.btn-thumbs-down');
    if (thumbsDownBtn) thumbsDownBtn.classList.remove('active-bad');
    showToast(isLiked ? 'Thank you for your feedback! 👍' : 'Feedback removed', 'success');
    return;
  }

  // Thumbs down button
  const thumbsDownBtn = e.target.closest('.btn-thumbs-down');
  if (thumbsDownBtn) {
    const isDisliked = thumbsDownBtn.classList.toggle('active-bad');
    const thumbsUpBtn = thumbsDownBtn.parentElement.querySelector('.btn-thumbs-up');
    if (thumbsUpBtn) thumbsUpBtn.classList.remove('active-good');
    showToast(isDisliked ? 'Thank you for your feedback! 👎' : 'Feedback removed', 'info');
    return;
  }

  // Regenerate message button
  const retryBtn = e.target.closest('.btn-retry-msg');
  if (retryBtn) {
    const lastUserMsg = [...state.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content && !state.isStreaming) {
      showToast('Regenerating response...', 'info');
      sendMessage(lastUserMsg.content);
    }
    return;
  }

  // More options button
  const moreBtn = e.target.closest('.btn-more-msg');
  if (moreBtn) {
    const msgId = moreBtn.dataset.msgId;
    const msg   = state.messages.find(m => m.id === msgId);
    if (msg && msg.content) {
      copyTextToClipboard(msg.content);
      showToast('More options: Response copied to clipboard!', 'success');
    }
    return;
  }

  // Edit message button
  const editBtn = e.target.closest('.btn-edit-msg');
  if (editBtn) {
    const msgId = editBtn.dataset.msgId;
    const msg   = state.messages.find(m => m.id === msgId);
    if (msg && msg.content) {
      DOM.chatInput.value = msg.content;
      DOM.chatInput.dispatchEvent(new Event('input'));
      DOM.chatInput.focus();
      DOM.chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Loaded message into prompt box to edit', 'success');
    }
    return;
  }
});

DOM.chatInput.addEventListener('input', () => {
  const len = DOM.chatInput.value.length;
  DOM.charCount.textContent = `${len} / 10000`;
  DOM.sendBtn.disabled      = len === 0 || state.isStreaming;

  // Auto-resize textarea
  DOM.chatInput.style.height = 'auto';
  DOM.chatInput.style.height = Math.min(DOM.chatInput.scrollHeight, 200) + 'px';

  // Skill hint
  const msg = DOM.chatInput.value.toLowerCase();
  if (/write|essay|article/i.test(msg)) {
    DOM.skillHint.textContent = '✍️ Ship30for30 Essay mode detected';
    DOM.skillHint.style.color = 'var(--amber)';
  } else if (/html|artifact|generate|dashboard/i.test(msg)) {
    DOM.skillHint.textContent = '🖼️ Artifact generation mode detected';
    DOM.skillHint.style.color = 'var(--emerald)';
  } else {
    DOM.skillHint.textContent = '💡 Try: "write an essay about..." or "generate HTML for..."';
    DOM.skillHint.style.color = '';
  }
});

DOM.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = DOM.chatInput.value.trim();
    if (text && !state.isStreaming) {
      DOM.chatInput.value = '';
      DOM.chatInput.style.height = 'auto';
      DOM.charCount.textContent = '0 / 10000';
      DOM.sendBtn.disabled = true;
      DOM.skillHint.textContent = '💡 Try: "write an essay about..." or "generate HTML for..."';
      DOM.skillHint.style.color = '';
      sendMessage(text);
    }
  }
});

DOM.sendBtn.addEventListener('click', () => {
  const text = DOM.chatInput.value.trim();
  if (text && !state.isStreaming) {
    DOM.chatInput.value = '';
    DOM.chatInput.style.height = 'auto';
    DOM.charCount.textContent = '0 / 10000';
    DOM.sendBtn.disabled = true;
    sendMessage(text);
  }
});

// Suggestion chips
document.getElementById('suggestion-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const msg = chip.dataset.msg;
  DOM.chatInput.value = msg;
  DOM.chatInput.dispatchEvent(new Event('input'));
  DOM.chatInput.focus();
});

// Artifact panel events
DOM.tabPreview.addEventListener('click', () => switchArtifactTab('preview'));
DOM.tabCode.addEventListener('click',    () => switchArtifactTab('code'));
DOM.btnCloseArtifact.addEventListener('click', closeArtifactPanel);

DOM.btnCopyArtifact.addEventListener('click', async () => {
  if (!state.currentArtifact) return;
  try {
    await copyTextToClipboard(state.currentArtifact.content);
    DOM.btnCopyArtifact.textContent = '✓ Copied!';
    setTimeout(() => {
      DOM.btnCopyArtifact.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy`;
    }, 2000);
  } catch { showToast('Copy failed', 'error'); }
});

// LLM toggle
DOM.pillOllama.addEventListener('click', () => {
  switchLLMProvider('ollama', 'llama3.2');
});
DOM.pillAnthropic.addEventListener('click', () => {
  switchLLMProvider('anthropic', 'claude-3-5-haiku-20241022');
});

// ── Share Modal ────────────────────────────────────────────────────────────────
const shareOverlay   = document.getElementById('share-overlay');
const sharePreview   = shareOverlay.querySelector('.share-preview-content');
const btnShareClose  = document.getElementById('btn-share-close');
const btnShareCopy   = document.getElementById('share-copy-link');
const btnShareTwit   = document.getElementById('share-twitter');
const btnShareLI     = document.getElementById('share-linkedin');
const btnShareReddit = document.getElementById('share-reddit');

let _shareContent = '';

function openShareModal(content) {
  _shareContent = content;
  // Show a trimmed preview (first 200 chars)
  const preview = content.replace(/[#*`]/g, '').trim().slice(0, 200);
  sharePreview.textContent = preview + (content.length > 200 ? '…' : '');
  shareOverlay.hidden = false;
}

function closeShareModal() {
  shareOverlay.hidden = true;
  btnShareCopy.classList.remove('copied');
  btnShareCopy.querySelector('span').textContent = 'Copy link';
}

btnShareClose.addEventListener('click', closeShareModal);
shareOverlay.addEventListener('click', e => { if (e.target === shareOverlay) closeShareModal(); });

btnShareCopy.addEventListener('click', async () => {
  try {
    await copyTextToClipboard(window.location.href);
    btnShareCopy.classList.add('copied');
    btnShareCopy.querySelector('span').textContent = 'Copied!';
    setTimeout(() => {
      btnShareCopy.classList.remove('copied');
      btnShareCopy.querySelector('span').textContent = 'Copy link';
    }, 2500);
  } catch { showToast('Copy failed', 'error'); }
});

btnShareTwit.addEventListener('click', () => {
  const text = encodeURIComponent(_shareContent.slice(0, 240) + '\n\n— via Lenny AI');
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  closeShareModal();
});

btnShareLI.addEventListener('click', () => {
  const text = encodeURIComponent(_shareContent.slice(0, 700));
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`, '_blank');
  closeShareModal();
});

btnShareReddit.addEventListener('click', () => {
  const title = encodeURIComponent('Insights from Lenny AI');
  const text  = encodeURIComponent(_shareContent.slice(0, 300));
  window.open(`https://www.reddit.com/submit?title=${title}&text=${text}`, '_blank');
  closeShareModal();
});

// ── Sidebar Toggle ─────────────────────────────────────────────────────────────
function toggleSidebar(collapse) {
  if (collapse) {
    document.body.classList.add('sidebar-collapsed');
  } else {
    document.body.classList.remove('sidebar-collapsed');
  }
}

DOM.btnCloseSidebar.addEventListener('click', () => toggleSidebar(true));
DOM.btnOpenSidebar.addEventListener('click',  () => toggleSidebar(false));

// Delete modal
DOM.btnModalCancel.addEventListener('click', () => {
  DOM.modalOverlay.hidden = true;
  state.pendingDeleteId   = null;
});

DOM.btnModalConfirm.addEventListener('click', async () => {
  DOM.modalOverlay.hidden = true;
  if (state.pendingDeleteId) {
    await deleteSession(state.pendingDeleteId);
    state.pendingDeleteId = null;
  }
});

DOM.modalOverlay.addEventListener('click', (e) => {
  if (e.target === DOM.modalOverlay) {
    DOM.modalOverlay.hidden = true;
    state.pendingDeleteId   = null;
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Load current LLM config from backend
  try {
    const config = await apiGet('/config');
    state.llmProvider = config.provider;
    state.llmModel    = config.model;
    DOM.modelBadge.textContent = config.model;
    DOM.pillOllama.classList.toggle('active', config.provider === 'ollama');
    DOM.pillAnthropic.classList.toggle('active', config.provider === 'anthropic');
  } catch (_) {
    // Backend not available yet — use defaults
  }

  await loadSessions();

  // Auto-activate most recent session
  if (state.sessions.length > 0) {
    await activateSession(state.sessions[0].id);
  }
}

init();
