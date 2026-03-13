import type { ReactNode } from "react";

interface Feature {
  title: string;
  desc: string;
  tag: string;
  icon: ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: "Real-Time Sync",
    desc: "Shared edits propagate in real time, so collaborators stay in flow without refreshes or manual saves.",
    tag: "Room-based collaboration",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: "Live Cursors",
    desc: "See where collaborators are working with color-coded cursors, labels, and shared presence.",
    tag: "Per-user colors",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Offline-First",
    desc: "Keep working when the network drops. Local changes persist and sync back when the connection returns.",
    tag: "IndexedDB-backed",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0122.56 9" />
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
        <path d="M8.53 16.11a6 6 0 016.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  {
    title: "Zero Conflicts",
    desc: "Yjs CRDTs keep concurrent edits convergent, so the room stays consistent under real collaboration.",
    tag: "Deterministic merge",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M6 21V9a9 9 0 009 9" />
      </svg>
    ),
  },
  {
    title: "Open by Default",
    desc: "Open source and self-hostable, built on collaboration primitives developers can inspect and extend.",
    tag: "Open source",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Monaco Editor",
    desc: "The VS Code editing engine in the browser, with familiar shortcuts and language tooling.",
    tag: "15+ languages",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="container">
        <div className="section-label">Why Code Duo</div>
        <h2 className="section-title">
          Built for serious
          <br />
          <span style={{ color: "var(--blue)" }}>collaboration</span>
        </h2>

        <div className="features-grid">
          {FEATURES.map(({ title, desc, tag, icon }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon-wrap">{icon}</div>
              <div className="feature-title">{title}</div>
              <div className="feature-desc">{desc}</div>
              <div className="feature-tag">
                <span className="feature-tag-dot" />
                {tag}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
