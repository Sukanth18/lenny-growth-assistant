import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import { X, Copy, Check, Code2, Eye, FileCode2, Globe, ExternalLink, Maximize2 } from 'lucide-react';
import useAppStore from '../../store/appStore';

export default function ArtifactPanel() {
  const { artifact, artifactOpen, closeArtifact, artifactTab, setArtifactTab, addToast } = useAppStore();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!artifact?.content) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      addToast('Artifact copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch { addToast('Copy failed', 'error'); }
  };

  const openInNewTab = () => {
    const blob = new Blob([artifact?.content || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const isHtml = artifact?.type === 'html';
  const title  = isHtml ? 'HTML Artifact' : 'Markdown Document';

  return (
    <AnimatePresence>
      {artifactOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 520, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          style={{
            flexShrink: 0,
            height: '100%',
            borderLeft: '1px solid var(--color-border)',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isHtml ? 'var(--color-accent-light)' : 'var(--color-secondary-light)',
                border: `1px solid ${isHtml ? 'var(--color-accent-ring)' : 'var(--color-secondary-ring)'}`,
              }}>
                {isHtml
                  ? <Globe size={15} style={{ color: 'var(--color-accent)' }} />
                  : <FileCode2 size={15} style={{ color: 'var(--color-secondary)' }} />
                }
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0, marginTop: 1 }}>
                  {isHtml ? 'Interactive HTML' : 'Rendered Markdown'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isHtml && (
                <button onClick={openInNewTab} className="btn-ghost" style={{ fontSize: 12, gap: 4 }}>
                  <ExternalLink size={13} />
                  Open
                </button>
              )}
              <button onClick={copy} className="btn-ghost" style={{ fontSize: 12 }}>
                {copied ? <Check size={13} style={{ color: 'var(--color-secondary)' }} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={closeArtifact} className="btn-icon">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            flexShrink: 0,
          }}>
            {[
              { id: 'preview', label: 'Preview', Icon: Eye },
              { id: 'code',    label: 'Code',    Icon: Code2 },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setArtifactTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '12px 14px',
                  fontSize: 12, fontWeight: 600,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  borderBottom: `2px solid ${artifactTab === id ? 'var(--color-primary)' : 'transparent'}`,
                  marginBottom: -1,
                  color: artifactTab === id ? 'var(--color-primary)' : 'var(--color-ink-secondary)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Content ────────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {artifact?._loading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 0.75, 0.9, 0.6, 0.8].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 16, borderRadius: 8, width: `${w * 100}%` }} />
                ))}
              </div>
            ) : artifactTab === 'preview' ? (
              isHtml ? (
                <iframe
                  key={artifact?.content?.length}
                  srcDoc={artifact?.content || ''}
                  title="HTML Artifact Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#fff',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  className="prose scrollbar-thin"
                  style={{
                    padding: 24,
                    overflowY: 'auto',
                    height: '100%',
                  }}
                  dangerouslySetInnerHTML={{ __html: marked.parse(artifact?.content || '') }}
                />
              )
            ) : (
              <pre
                className="scrollbar-thin"
                style={{
                  padding: 20,
                  overflow: 'auto',
                  height: '100%',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.7,
                  background: '#1E293B',
                  color: '#CBD5E1',
                  margin: 0,
                }}
              >
                {artifact?.content || ''}
              </pre>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
