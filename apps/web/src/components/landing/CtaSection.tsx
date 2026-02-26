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
            Ready to code
            <br />
            <em>together?</em>
          </h2>
          <p>
            Create a room in seconds. No sign-up, no setup, no friction. Just
            share the link and start collaborating.
          </p>
          <div className="cta-actions">
            <button
              onClick={onCreateRoom}
              className="btn-primary-lg"
              aria-label="Start a new coding session"
            >
              Start a session
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
            Free &amp; open source — no account required
          </p>
        </div>
      </div>
    </section>
  );
}
