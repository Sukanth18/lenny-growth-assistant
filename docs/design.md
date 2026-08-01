# UI/UX Design Document — The Lenny Growth Assistant

**Tool Reference:** [Impeccable.style](https://impeccable.style) principles applied throughout.

---

## 1. Design Philosophy

**Three Core Principles:**

1. **Clarity over decoration** — Every visual element must earn its place. No ornamental UI.
2. **Content-first** — The AI output is the product. Chrome should disappear.
3. **Progressive disclosure** — Show complexity only when needed (e.g., artifact panel slides in only when an artifact is generated).

---

## 2. Visual Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0c0e16` | Page background |
| `--bg-elevated` | `#111420` | Sidebar, panels |
| `--bg-surface` | `#161929` | Cards, artifact header |
| `--accent` | `#6366f1` | Interactive elements, primary CTA |
| `--emerald` | `#10b981` | Artifact actions (green = "create") |
| `--amber` | `#f59e0b` | Ship30for30 badge (orange = "write") |
| `--text-primary` | `#e8eaf6` | Main readable text |
| `--text-secondary` | `#8b92b8` | Supporting text |
| `--text-muted` | `#4a5080` | Hints, metadata |

**Rationale:** Deep space dark mode reduces eye strain during long research sessions. The indigo accent communicates intelligence and tech. Emerald for artifacts = creation and output.

### Typography

- **Primary Font:** Inter — clean, modern, highly readable at small sizes
- **Monospace Font:** JetBrains Mono — artifact code tab, model badge
- **Scale:** 11px (labels) → 12px (metadata) → 13-14px (body) → 17-22px (headings)
- **Weight system:** 400 (body) / 500 (UI labels) / 600-700 (headings, CTAs)

### Spacing & Radius

- Consistent 4px grid: 4, 8, 12, 16, 20, 24, 32, 40
- Border radius: 6px (small), 10px (medium), 16px (large bubbles), 20px (input wrapper)
- This creates a "soft but structured" feel — not too rounded (toy-like), not too sharp (cold)

---

## 3. Layout Architecture

```
┌──────────────┬────────────────────────────┬──────────────────┐
│   SIDEBAR    │       CHAT PANEL           │  ARTIFACT PANEL  │
│   272px      │       flex: 1              │   480px          │
│              │                            │   (slides in)    │
│  Logo        │  Empty state OR            │                  │
│  [+ New Chat]│  Message history           │  Header + Tabs   │
│              │                            │  Preview/Code    │
│  Session     │  ──────────────────────    │                  │
│  List        │  Input bar (max 760px)     │                  │
│              │                            │                  │
│  LLM Toggle  │                            │                  │
└──────────────┴────────────────────────────┴──────────────────┘
```

**Why this layout:**
- Sidebar mirrors ChatGPT muscle memory — users know where sessions live
- Chat panel has a max-width input (760px) to prevent uncomfortably long lines
- Artifact panel uses the full vertical height for maximum content space
- When closed, the chat panel expands naturally (flex: 1)

---

## 4. Component Design Decisions

### Session Sidebar
- Session items show a delete button only on hover — prevents accidental deletion
- The active session uses a subtle indigo background + left indicator
- Sessions list auto-scrolls; overflow hidden on sidebar prevents layout breaks

### Message Bubbles
- **User messages:** Gradient indigo pill, right-aligned — clear sender distinction
- **Assistant messages:** Dark card, left-aligned, renders full Markdown
- **Skill badge:** Small pill above each AI response — users know HOW it answered
- **Artifact link button:** Emerald "View Artifact" button appears below message — one click to reveal

### Artifact Viewer
- **Slide-in animation:** `slideInRight` — artifact panel feels like it's being revealed, not popped
- **Preview tab (default):** HTML in sandboxed iframe (security), Markdown in styled div
- **Code tab:** Prism.js syntax highlighting — evaluators can inspect raw output
- **Skeleton loading:** Shimmer animation while artifact streams in — avoids jarring content flash
- **Copy button:** Clipboard API — practical for engineers who want the raw output

### Input Bar
- Auto-resizing textarea (max 200px height)
- Real-time character counter
- **Skill hint:** Changes color and text as user types — immediate feedback on which mode will trigger
- Send button disabled when empty or streaming — prevents duplicate requests

### LLM Toggle
- Segmented pill control at sidebar bottom
- One click = instant switch via `PATCH /config`
- Model badge (monospace font) shows the exact model name

---

## 5. Interaction Patterns

| Trigger | Interaction | Response |
|---------|-------------|----------|
| Send message | Optimistic user bubble + streaming assistant bubble | Token-by-token rendering |
| Artifact detected | Artifact panel slides in from right | Skeleton → content transition |
| Click "View Artifact" | Re-opens artifact panel | Smooth animation |
| Switch LLM | API call + pill highlight | Toast confirmation |
| Delete session | Modal confirmation | Session removed from list |
| Tab between Preview/Code | Toggle panels | Instant, no re-render |

---

## 6. Micro-Animations

| Element | Animation | Purpose |
|---------|-----------|---------|
| Empty state icon | Float (3s ease-in-out loop) | Alive, inviting |
| Empty state | fadeIn on load | Smooth entry |
| Message rows | slideUp (200ms) | New messages feel delivered |
| Artifact panel | slideInRight (400ms) | Feels like a panel opening |
| Modal | scaleIn (250ms) | Focused attention |
| Send button hover | scale(1.08) + glow | Interactive feedback |
| Cursor blink | 1s step-end | Real-time typing illusion |
| Skeleton shimmer | 1.5s shimmer loop | Content is coming |

---

## 7. Accessibility

- All interactive elements have `aria-label` attributes
- Session list uses `role="list"` and `role="listitem"`
- Chat history uses `role="log"` with `aria-live="polite"` for screen readers
- Modal uses `role="dialog"` and `aria-modal="true"`
- Toast uses `role="status"` and `aria-live="polite"`
- Keyboard: Enter sends message (Shift+Enter = newline), Tab navigates focus

---

## 8. Responsive Strategy

| Breakpoint | Adaptation |
|------------|------------|
| < 900px | Artifact panel overlays fullscreen |
| < 680px | Sidebar hidden; suggestion chips go single column |
| Touch | Textarea `rows=1` auto-grows; send button large tap target |

---

## 9. UX Flow: From Zero to Artifact

```
1. Land on page
   └──► Empty state with floating emoji + suggestion chips

2. Click suggestion chip OR type message
   └──► Chip pre-fills input; user hits Enter

3. First message sent
   └──► New session auto-created
   └──► User bubble appears immediately
   └──► Skill badge announces: "🖼️ Artifact"

4. Artifact streams in
   └──► Artifact panel slides in from right
   └──► Skeleton shimmer → real content renders
   └──► "View Artifact" button appears in message bubble

5. User switches to Code tab
   └──► Raw source with syntax highlighting

6. User copies artifact
   └──► "✓ Copied!" confirmation → reverts to "Copy" after 2s

7. User switches to Claude
   └──► Click "Claude" pill → Toast "Switched to Claude"
   └──► Next message uses Anthropic API
```

---

## 10. Design Inspirations

- **Chat panel:** ChatGPT / Claude.ai conversation UX patterns
- **Artifact viewer:** Claude Artifacts side panel with Code/Preview tabs
- **Sidebar:** Notion / Linear session list patterns
- **Color mood:** Linear.app dark mode — deep blue-purple with focused accent
- **Typography:** Vercel / Anthropic documentation — Inter + mono hybrid
- **Micro-animations:** Framer Motion principles (easing, slide-in reveals) applied in vanilla CSS
