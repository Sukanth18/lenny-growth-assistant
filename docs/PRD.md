# Product Requirements Document — The Lenny Growth Assistant

**Version:** 1.0  
**Date:** 2026-07-30  
**Author:** [Your Name]  
**Status:** Approved

---

## 1. Problem Statement

Product managers, growth leaders, and founders frequently reference Lenny Rachitsky's podcast as a go-to knowledge source. However, the podcast has 500+ episodes totaling thousands of hours. Synthesizing insights across episodes is time-consuming and manual.

**The problem:** There is no fast, interactive way to query the cumulative wisdom of Lenny's Podcast, generate structured content from it, or create visual artifacts based on those insights.

---

## 2. Proposed Solution

An AI-powered conversational web application that:
1. Ingests and indexes all Lenny's Podcast transcripts
2. Answers product/growth questions strictly grounded in those transcripts
3. Generates Ship30for30-style essays synthesizing transcript insights
4. Creates HTML/Markdown artifacts rendered live in a split-pane UI
5. Supports both local (Ollama) and cloud (Anthropic Claude) LLM backends

---

## 3. User Personas

### Primary: The PM Practitioner
- Senior PM or growth lead at a Series A-B startup
- Frequently listens to Lenny's Podcast for tactical advice
- **Goal:** Get specific, cited answers to PM challenges without re-listening to episodes
- **Pain:** Can't remember which episode covered a specific topic

### Secondary: The Content Creator
- Product writer or thought leader building an audience
- **Goal:** Generate high-quality, insights-backed essays in Ship30for30 style
- **Pain:** Synthesizing multiple podcast insights into coherent content takes hours

---

## 4. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | PM Practitioner | Ask "how did Figma achieve PMF?" and get a cited answer | I can reference specific episodes |
| US-2 | PM Practitioner | Start a new chat session | I can organize different research threads |
| US-3 | Content Creator | Ask for a 1250-word essay on PLG | I get a publication-ready Ship30for30 essay |
| US-4 | PM Practitioner | Ask for an HTML dashboard of growth frameworks | The dashboard renders in-app immediately |
| US-5 | Any User | Switch from Ollama to Claude mid-session | I can compare output quality without restarting |
| US-6 | Any User | See which skill (Q&A / Essay / Artifact) was used | I understand how the AI answered |

---

## 5. Feature Requirements

### P0 (Must Have)
- [x] RAG-powered Q&A over Lenny transcripts
- [x] Ship30for30 essay generation (~1250 words)
- [x] Artifact generation (HTML + Markdown) with in-app viewer
- [x] Session management (create, list, delete, persist)
- [x] Ollama local LLM support (fully offline)
- [x] Streaming responses (SSE)
- [x] Message persistence in PostgreSQL

### P1 (Should Have)
- [x] Anthropic Claude integration
- [x] Live LLM toggle (Ollama ↔ Claude) without restart
- [x] Skill badge on each message (Q&A / Essay / Artifact)
- [x] Artifact copy button
- [x] Code tab (syntax highlighted) in artifact viewer

### P2 (Nice to Have)
- [ ] Multi-user authentication (JWT)
- [ ] Session export to Markdown
- [ ] Transcript source citation links
- [ ] Mobile responsive layout

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | First token streamed within 2s (Ollama), 1s (Claude) |
| **Reliability** | Graceful error on Ollama timeout; no crash |
| **Security** | HTML artifacts sandboxed in iframe; no XSS risk |
| **Portability** | Runs on any machine with Python 3.11+ and Ollama |
| **Privacy** | No user data sent to third parties (Ollama mode) |

---

## 7. Success Metrics

- Q&A answers cite the correct episode guest ≥ 90% of the time
- Ship30for30 essays are 1100–1400 words (verified with word count)
- HTML artifacts render without errors in the iframe sandbox
- LLM toggle works within 1 API call, takes effect on next message
- All sessions and messages persist across browser refreshes
