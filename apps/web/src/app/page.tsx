"use client";

import { useState } from "react";
import Link from "next/link";
import CreateRoomDialog from "@/components/room/CreateRoomDialog";
import KeyboardShortcutsDialog from "@/components/landing/KeyboardShortcutsDialog";
import ToastNotification from "@/components/landing/ToastNotification";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import StepsSection from "@/components/landing/StepsSection";

export default function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);
  const toast = useKeyboardShortcuts();

  return (
    <>
      <div className="landing-page">
        {/* ── Nav ── */}
        <nav className="landing-nav">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">cd</div>
            CodeDuo
          </Link>
          <ul className="nav-links">
            <li><a href="#">Docs</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Pricing</a></li>
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          </ul>
          <div className="nav-right">
            <a href="#" className="btn-ghost">
              Sign in <span className="kbd">S</span>
            </a>
            <button
              onClick={() => setCreateOpen(true)}
              className="btn-primary"
            >
              Create room{" "}
              <span
                className="kbd"
                style={{
                  color: "rgba(0,0,0,0.5)",
                  background: "rgba(0,0,0,0.15)",
                  borderColor: "rgba(0,0,0,0.2)",
                }}
              >
                C
              </span>
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="container">
            <div className="hero-eyebrow fade-up delay-1">Now in open beta</div>
            <h1 className="fade-up delay-2">
              Code together,
              <br />
              <em>conflict-free</em>
            </h1>
            <p className="hero-sub fade-up delay-3">
              Real-time collaborative editing powered by CRDTs. No merge hell,
              no polling. Just open a room and code.
            </p>
            <div className="hero-actions fade-up delay-4">
              <button
                onClick={() => setCreateOpen(true)}
                className="btn-primary-lg"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
                Start a session
                <span
                  className="kbd"
                  style={{
                    color: "rgba(0,0,0,0.5)",
                    background: "rgba(0,0,0,0.15)",
                    borderColor: "rgba(0,0,0,0.2)",
                  }}
                >
                  C
                </span>
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary-lg"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 8 12 12 14 14" />
                </svg>
                Clone source
                <span className="kbd">G</span>
              </a>
            </div>
            <p className="hero-note fade-up delay-5">
              Free &amp; open source — no account required
            </p>

            {/* Three pillars */}
            <div className="tagline-pills fade-up delay-5">
              <div className="pill">
                <div className="pill-icon" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <div className="pill-title" style={{ color: "rgba(255,255,255,0.8)" }}>Fast</div>
                  <div className="pill-desc">
                    Syncs in under 50ms. WebSocket-native, no polling, no
                    latency surprises.
                  </div>
                </div>
              </div>
              <div className="pill">
                <div className="pill-icon" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                </div>
                <div>
                  <div className="pill-title" style={{ color: "rgba(255,255,255,0.8)" }}>Intelligent</div>
                  <div className="pill-desc">
                    Yjs CRDTs merge concurrent edits deterministically. Zero
                    conflict resolution.
                  </div>
                </div>
              </div>
              <div className="pill">
                <div className="pill-icon" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <div className="pill-title" style={{ color: "rgba(255,255,255,0.8)" }}>Collaborative</div>
                  <div className="pill-desc">
                    Live cursors with name labels, presence indicators, and room
                    sharing in one click.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Editor Section ── */}
        <section className="editor-section">
          <div className="container">
            <div className="editor-layout">
              <div>
                <div className="section-label">Live demo</div>
                <h2 className="section-title">
                  Two cursors,
                  <br />
                  <span style={{ color: "var(--blue)" }}>one editor</span>
                </h2>
                <p className="section-desc">
                  Watch Alice and Bob type simultaneously — no conflicts, no
                  waiting, no refreshes. Just real-time magic.
                </p>

                <div className="presence-badges" style={{ marginTop: "32px" }}>
                  <div className="presence-badge">
                    <div className="presence-avatar" style={{ background: "var(--blue)" }}>A</div>
                    <span>Alice</span>
                    <div className="online-dot" />
                  </div>
                  <div className="presence-badge">
                    <div className="presence-avatar" style={{ background: "var(--green)" }}>B</div>
                    <span>Bob</span>
                    <div className="online-dot" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-lp-mono)",
                      fontSize: "11px",
                      color: "var(--text-dim)",
                      padding: "6px 12px",
                      border: "1px dashed var(--lp-border)",
                      borderRadius: "100px",
                    }}
                  >
                    + invite
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "32px",
                    padding: "20px",
                    background: "var(--bg2)",
                    border: "1px solid var(--lp-border)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-lp-mono)",
                      fontSize: "11px",
                      color: "var(--text-dim)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Room info
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-lp-mono)" }}>room</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-lp-mono)" }}>abc-123-xyz</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-lp-mono)" }}>language</span>
                      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-lp-mono)" }}>TypeScript</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-lp-mono)" }}>connected</span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-lp-mono)" }}>2 / ∞</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-lp-mono)" }}>sync latency</span>
                      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-lp-mono)" }}>&lt; 50ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor mock */}
              <div className="editor-mock">
                <div className="editor-titlebar">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontFamily: "var(--font-lp-mono)",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    codeduo — collab.ts
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--blue)",
                        boxShadow: "0 0 0 2px #161b22",
                      }}
                    />
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--green)",
                        marginLeft: "-4px",
                        boxShadow: "0 0 0 2px #161b22",
                      }}
                    />
                  </div>
                </div>
                <div className="editor-tabs">
                  <div className="editor-tab active">collab.ts</div>
                  <div className="editor-tab">room.ts</div>
                  <div className="editor-tab">types.ts</div>
                  <div style={{ flex: 1, background: "#161b22" }} />
                </div>
                <div className="editor-body">
                  <div className="line-nums">
                    <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div>
                    <div>6</div><div>7</div><div>8</div><div>9</div><div>10</div>
                    <div>11</div>
                  </div>
                  <div className="code-lines">
                    <div className="code-line">
                      <span className="tok-keyword">import</span>{" "}
                      <span className="tok-punct">{"{ "}</span>
                      <span className="tok-type">Doc</span>
                      <span className="tok-punct">{" }"}</span>{" "}
                      <span className="tok-keyword">from</span>{" "}
                      <span className="tok-string">&quot;yjs&quot;</span>
                      <span className="tok-punct">;</span>
                    </div>
                    <div className="code-line active-line">
                      <span className="tok-keyword">import</span>{" "}
                      <span className="tok-punct">{"{ "}</span>
                      <span className="tok-type">WebsocketProvider</span>
                      <span className="tok-punct">{" }"}</span>{" "}
                      <span className="tok-keyword">from</span>{" "}
                      <span className="tok-string">&quot;y-websocket&quot;</span>
                      <span className="tok-punct">;</span>
                      <span className="cursor-a" />
                    </div>
                    <div className="code-line">&nbsp;</div>
                    <div className="code-line">
                      <span className="tok-keyword">const</span>{" "}
                      <span className="tok-var">doc</span>{" "}
                      <span className="tok-punct">= </span>
                      <span className="tok-keyword">new</span>{" "}
                      <span className="tok-type">Doc</span>
                      <span className="tok-punct">();</span>
                    </div>
                    <div className="code-line">
                      <span className="tok-keyword">const</span>{" "}
                      <span className="tok-var">provider</span>{" "}
                      <span className="tok-punct">= </span>
                      <span className="tok-keyword">new</span>{" "}
                      <span className="tok-type">WebsocketProvider</span>
                      <span className="tok-punct">(</span>
                    </div>
                    <div className="code-line">
                      <span className="tok-punct">{"  "}</span>
                      <span className="tok-string">&quot;wss://codeduo.dev&quot;</span>
                      <span className="tok-punct">, </span>
                      <span className="tok-string">&quot;room-1&quot;</span>
                      <span className="tok-punct">, </span>
                      <span className="tok-var">doc</span>
                      <span className="tok-punct">);</span>
                    </div>
                    <div className="code-line">&nbsp;</div>
                    <div className="code-line">
                      <span className="tok-comment">{"// Real-time \u2014 zero conflicts"}</span>
                    </div>
                    <div className="code-line active-line">
                      <span className="tok-keyword">const</span>{" "}
                      <span className="tok-var">text</span>{" "}
                      <span className="tok-punct">= </span>
                      <span className="tok-var">doc</span>
                      <span className="tok-punct">.</span>
                      <span className="tok-fn">getText</span>
                      <span className="tok-punct">(</span>
                      <span className="tok-string">&quot;editor&quot;</span>
                      <span className="tok-punct">);</span>
                      <span className="cursor-b" />
                    </div>
                    <div className="code-line">
                      <span className="tok-var">text</span>
                      <span className="tok-punct">.</span>
                      <span className="tok-fn">observe</span>
                      <span className="tok-punct">{"(() => {"}</span>
                    </div>
                    <div className="code-line">
                      <span className="tok-punct">{"  "}</span>
                      <span className="tok-var">console</span>
                      <span className="tok-punct">.</span>
                      <span className="tok-fn">log</span>
                      <span className="tok-punct">(</span>
                      <span className="tok-var">text</span>
                      <span className="tok-punct">.</span>
                      <span className="tok-fn">toString</span>
                      <span className="tok-punct">());</span>
                    </div>
                    <div className="code-line">
                      <span className="tok-punct">{"});"}</span>
                    </div>
                  </div>
                </div>
                <div className="editor-statusbar">
                  <div className="status-left">
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.3)",
                        }}
                      />
                      Connected
                    </span>
                    <span>2 users</span>
                  </div>
                  <div className="status-right">
                    <span>TypeScript</span>
                    <span>UTF-8</span>
                    <span>LF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-cell">
                <div className="stat-value">&lt;50ms</div>
                <div className="stat-label">Sync latency</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">100%</div>
                <div className="stat-label">Conflict-free</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">0 KB</div>
                <div className="stat-label">Data on our servers</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">∞</div>
                <div className="stat-label">Concurrent editors</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="features-section">
          <div className="container">
            <div className="section-label">Why CodeDuo</div>
            <h2 className="section-title">
              Built for serious
              <br />
              <span style={{ color: "var(--blue)" }}>collaboration</span>
            </h2>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div className="feature-title">Real-Time Sync</div>
                <div className="feature-desc">
                  Changes propagate in milliseconds. No refresh, no polling —
                  instant collaboration.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  &lt; 50ms latency
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="feature-title">Live Cursors</div>
                <div className="feature-desc">
                  See exactly where collaborators are editing. Color-coded
                  cursors with name labels.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  Per-user colors
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0122.56 9" />
                    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 016.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                </div>
                <div className="feature-title">Offline Resilient</div>
                <div className="feature-desc">
                  Keep coding when disconnected. Edits queue locally and sync
                  when you reconnect.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  Zero data loss
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <circle cx="18" cy="18" r="3" />
                    <circle cx="6" cy="6" r="3" />
                    <path d="M6 21V9a9 9 0 009 9" />
                  </svg>
                </div>
                <div className="feature-title">Zero Conflicts</div>
                <div className="feature-desc">
                  Yjs CRDTs merge concurrent edits deterministically. No manual
                  resolution ever.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  Deterministic merge
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="feature-title">No Lock-In</div>
                <div className="feature-desc">
                  Open source and self-hostable. Your data never touches our
                  servers.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  Self-hostable
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrap" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div className="feature-title">Monaco Editor</div>
                <div className="feature-desc">
                  Full VS Code editing experience — syntax highlighting,
                  IntelliSense, multi-cursor.
                </div>
                <div
                  className="feature-tag"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  50+ languages
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="how-section">
          <div className="container">
            <div className="section-label">How it works</div>
            <h2 className="section-title">Up in <span style={{ color: "var(--blue)" }}>three</span> steps</h2>

            <StepsSection />
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-box">
              <h2>
                Ready to code
                <br />
                <em>together?</em>
              </h2>
              <p>
                Create a room in seconds. No sign-up, no setup, no friction.
                Just share the link and start collaborating.
              </p>
              <div className="cta-actions">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="btn-primary-lg"
                >
                  Start a session
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary-lg"
                >
                  View on GitHub
                </a>
              </div>
              <p className="cta-note">
                Free &amp; open source — no account required
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="landing-footer">
          <div className="footer-left">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="nav-logo-icon"
                style={{ width: "18px", height: "18px", fontSize: "8px" }}
              >
                cd
              </div>
              <span>CodeDuo</span>
            </div>
            <span>© 2026</span>
          </div>
          <ul className="footer-links">
            <li><a href="#">Docs</a></li>
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </footer>
      </div>

      {/* ── Global overlays ── */}
      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <KeyboardShortcutsDialog />
      <ToastNotification message={toast.message} visible={toast.visible} />
    </>
  );
}
