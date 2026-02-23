"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    number: "01",
    title: "Create a room",
    description:
      "Spin up a collaborative session in one click. Pick a language, name your room, and you're live.",
    accent: "#89b4fa",
    code: `$ curl -X POST /api/rooms
  { "id": "abc-123", "status": "live" }`,
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Send your teammates a room code or URL. No sign-up required — just click and join.",
    accent: "#cba6f7",
    code: `codeduo.dev/room/abc-123
  ✓ Link copied to clipboard`,
  },
  {
    number: "03",
    title: "Code together",
    description:
      "See cursors in real time, edits merge automatically via CRDTs. Zero conflicts. Zero friction.",
    accent: "#a6e3a1",
    code: `// 2 users connected
  Alice: typing line 14...
  Bob:   typing line 27...`,
  },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
      {STEPS.map((step, i) => (
        <div
          key={step.number}
          className={`group relative transition-all duration-700 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: `${i * 150}ms` }}
        >
          {/* Connector line on desktop */}
          {i < STEPS.length - 1 && (
            <div className="hidden md:block absolute top-10 -right-4 w-8 border-t border-dashed border-white/[0.08]" />
          )}

          {/* Step number */}
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] text-lg font-bold font-mono"
            style={{ color: step.accent, backgroundColor: `${step.accent}10` }}
          >
            {step.number}
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-white/90">
            {step.title}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-white/60">
            {step.description}
          </p>

          {/* Mini code block */}
          <div className="rounded-lg border border-white/[0.06] bg-[#181825]/80 p-3 font-mono text-[11px] leading-5 text-white/50">
            <pre className="whitespace-pre-wrap">{step.code}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
