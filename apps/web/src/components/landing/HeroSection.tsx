"use client";

interface HeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export default function HeroSection({ onCreateRoom, onJoinRoom }: HeroSectionProps) {
  return (
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
          <button onClick={onCreateRoom} className="btn-primary-lg">
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
          <button onClick={onJoinRoom} className="btn-secondary-lg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Join room
            <span className="kbd">J</span>
          </button>
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
                Syncs in under 50ms. WebSocket-native, no polling, no latency surprises.
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
                Yjs CRDTs merge concurrent edits deterministically. Zero conflict resolution.
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
                Live cursors with name labels, presence indicators, and room sharing in one click.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
