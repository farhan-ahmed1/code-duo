"use client";

import { useEffect, useRef, useState } from "react";

// Perimeter of a 44×44 rounded rect with rx=10:
// 2*(44-20) + 2*(44-20) + 2π*10 ≈ 159
const PERIM = 159;

const STEPS = [
  {
    number: "01",
    title: "Create a room",
    desc: "Spin up a session in one click. Pick a language, name your room, and you're live.",
    code: ["$ curl -X POST /api/rooms", '→ { "id": "abc-123" }'],
  },
  {
    number: "02",
    title: "Share the link",
    desc: "Send your teammates a room URL. No sign-up required — just click and join.",
    code: ["codeduo.dev/room/abc-123", "✓ Link copied to clipboard"],
  },
  {
    number: "03",
    title: "Code together",
    desc: "Cursors appear in real time. Edits merge via CRDTs. Zero conflicts, zero friction.",
    code: ["// 2 users connected", "Alice: line 14...", "Bob:   line 27..."],
  },
];

// phase i triggers:
//  0 → box 0 tracing begins
//  1 → connector 0 draws
//  2 → box 1 tracing begins
//  3 → connector 1 draws
//  4 → box 2 tracing begins
const TIMINGS = [0, 2000, 3400, 5400, 6800];

export default function StepsSection() {
  const [phase, setPhase] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          TIMINGS.forEach((delay, i) => {
            setTimeout(() => setPhase(i), delay);
          });
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -120px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="steps-wrapper">
      {/* ── Row 1: badges + connectors ── */}
      <div className="steps-badge-row">
        {STEPS.map((step, i) => {
          const boxLit = phase >= i * 2;
          const lineLit = phase >= i * 2 + 1;
          return (
            <div key={step.number} style={{ display: "contents" }}>
              {/* Badge */}
              <div className="step-badge-wrap">
                <div className="step-badge-base" />
                <svg
                  className="step-badge-svg"
                  viewBox="0 0 46 46"
                  width="44"
                  height="44"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="1"
                    width="44"
                    height="44"
                    rx="10"
                    stroke="#4d94ff"
                    strokeWidth="1.5"
                    strokeDasharray={PERIM}
                    strokeDashoffset={boxLit ? 0 : PERIM}
                    style={{
                      transition: boxLit
                        ? "stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)"
                        : "none",
                    }}
                  />
                </svg>
                <span
                  className="step-badge-num"
                  style={{
                    color: boxLit ? "#4d94ff" : "rgba(255,255,255,0.2)",
                    transition: "color 0.4s ease",
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* Connector (after each badge except the last) */}
              {i < STEPS.length - 1 && (
                <div className="step-connector">
                  <div className="step-connector-track" />
                  <div
                    className="step-connector-fill"
                    style={{
                      transform: lineLit ? "scaleX(1)" : "scaleX(0)",
                      transition: lineLit
                        ? "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        : "none",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Row 2: content (3-col grid aligned under badges) ── */}
      <div className="steps-content-row">
        {STEPS.map((step, i) => {
          const boxLit = phase >= i * 2;
          return (
            <div key={step.number} className="step-content">
              <div
                className="step-title"
                style={{
                  opacity: boxLit ? 1 : 0.25,
                  transition: "opacity 0.6s ease",
                }}
              >
                {step.title}
              </div>
              <div
                className="step-desc"
                style={{
                  opacity: boxLit ? 1 : 0.2,
                  transition: "opacity 0.6s ease 0.15s",
                }}
              >
                {step.desc}
              </div>
              <div
                className="step-code"
                style={{
                  opacity: boxLit ? 1 : 0.15,
                  transition: "opacity 0.6s ease 0.3s",
                }}
              >
                {step.code.map((line, j) => (
                  <div key={j}>{line}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
