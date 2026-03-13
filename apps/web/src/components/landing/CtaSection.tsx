"use client";

interface CtaSectionProps {
  onCreateRoom: () => void;
}

export default function CtaSection({ onCreateRoom }: CtaSectionProps) {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-box">
          <h2>
            Ready to open
            <br />
            <em>a room?</em>
          </h2>
          <p>
            Open a room in seconds, share the link, and start collaborating in
            a browser-based editor built for serious technical work.
          </p>
          <div className="cta-actions">
            <button
              onClick={onCreateRoom}
              className="btn-primary-lg"
              aria-label="Open a new collaborative coding room"
            >
              Open a room
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a
              href="https://github.com/farhan-ahmed1/code-duo"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary-lg"
              aria-label="View Code Duo source on GitHub (opens in new tab)"
            >
              View on GitHub
            </a>
          </div>
          <p className="cta-note">
            Free and open source. No account required.
          </p>
        </div>
      </div>
    </section>
  );
}
