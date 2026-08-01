import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Command, User, Settings, HelpCircle,
  LogOut, ChevronDown, Sparkles, Monitor, Zap
} from 'lucide-react';
import useAppStore from '../../store/appStore';

function ProfileDropdown({ onClose }) {
  const { llmProvider, llmModel, setLLM, sessions } = useAppStore();

  const items = [
    {
      group: 'Account',
      entries: [
        { icon: User, label: 'Profile', sub: 'Anonymous user', onClick: onClose },
        { icon: Monitor, label: 'Usage', sub: `${sessions.length} total chats`, onClick: onClose },
      ],
    },
    {
      group: 'Preferences',
      entries: [
        {
          icon: Sparkles,
          label: 'AI Model',
          sub: llmProvider === 'ollama' ? 'Llama 3.2 · Local' : 'Claude Haiku · API',
          onClick: () => {
            setLLM(
              llmProvider === 'ollama' ? 'anthropic' : 'ollama',
              llmProvider === 'ollama' ? 'claude-3-5-haiku-20241022' : 'llama3.2'
            );
            onClose();
          },
          badge: 'Switch',
        },
        { icon: Settings, label: 'Settings', sub: 'App preferences', onClick: onClose },
      ],
    },
    {
      group: 'Help',
      entries: [
        { icon: HelpCircle, label: 'Documentation', sub: 'Guides & API docs', onClick: onClose },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 260,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        zIndex: 200,
      }}
    >
      {/* Profile header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>U</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>User</p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0, marginTop: 2 }}>
              Lenny AI · Growth Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      {items.map((group, gi) => (
        <div key={gi} style={{ padding: '6px 6px', borderBottom: gi < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-ink-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '6px 10px 4px', margin: 0,
          }}>
            {group.group}
          </p>
          {group.entries.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <button
                key={i}
                onClick={entry.onClick}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'background 0.12s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'var(--color-bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: 'var(--color-ink-secondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    {entry.label}
                  </p>
                  {entry.sub && (
                    <p style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0, marginTop: 1 }}>
                      {entry.sub}
                    </p>
                  )}
                </div>
                {entry.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary-ring)',
                    padding: '2px 7px', borderRadius: 20,
                  }}>
                    {entry.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding: '6px 6px 6px' }}>
        <button
          onClick={onClose}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-danger-light)';
            e.currentTarget.querySelector('p').style.color = 'var(--color-danger)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.querySelector('p').style.color = 'var(--color-ink-secondary)';
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'var(--color-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LogOut size={14} style={{ color: 'var(--color-ink-muted)' }} />
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-secondary)', margin: 0, transition: 'color 0.12s' }}>
            Sign out
          </p>
        </button>
      </div>
    </motion.div>
  );
}

export default function TopNav({ onSearchClick }) {
  const { page } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageTitle = { dashboard: 'Dashboard', chat: 'Chat' }[page] || 'Lenny AI';

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  return (
    <header style={{
      height: 56, background: '#fff',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12, flexShrink: 0, zIndex: 10,
    }}>
      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
          {pageTitle}
        </p>
      </div>

      {/* Search trigger */}
      <button
        onClick={onSearchClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 10,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)', cursor: 'pointer',
          color: 'var(--color-ink-muted)',
          fontSize: 13, transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
      >
        <Search size={14} />
        <span style={{ display: 'none' }} className="sm-show">Search…</span>
        <kbd style={{
          display: 'flex', alignItems: 'center', gap: 2,
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--color-ink-muted)',
          background: 'var(--color-bg-subtle)',
          padding: '2px 6px', borderRadius: 6,
          border: '1px solid var(--color-border)',
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <button className="btn-icon" style={{ position: 'relative' }}>
        <Bell size={16} />
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-accent)',
        }} />
      </button>

      {/* User avatar + dropdown */}
      <div ref={profileRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setProfileOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px 4px 4px',
            borderRadius: 10,
            border: profileOpen ? '1px solid var(--color-primary-ring)' : '1px solid transparent',
            background: profileOpen ? 'var(--color-primary-light)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!profileOpen) e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
          onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          {/* Avatar circle */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>U</span>
          </div>
          <ChevronDown
            size={13}
            style={{
              color: 'var(--color-ink-secondary)',
              transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {profileOpen && (
            <ProfileDropdown onClose={() => setProfileOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
