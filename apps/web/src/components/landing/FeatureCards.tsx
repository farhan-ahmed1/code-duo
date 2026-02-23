"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, MousePointerClick, WifiOff, GitMerge, Shield, Code2 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Sync",
    description:
      "Changes propagate in milliseconds. No refresh, no polling — instant collaboration powered by CRDTs.",
    color: "#f9e2af",
    detail: "< 50ms latency",
  },
  {
    icon: MousePointerClick,
    title: "Live Cursors",
    description:
      "See exactly where your collaborators are editing. Color-coded cursors with name labels, in real time.",
    color: "#89b4fa",
    detail: "Per-user colors",
  },
  {
    icon: WifiOff,
    title: "Offline Resilient",
    description:
      "Keep coding when disconnected. Edits queue locally and sync automatically when you reconnect.",
    color: "#a6e3a1",
    detail: "Zero data loss",
  },
  {
    icon: GitMerge,
    title: "Zero Conflicts",
    description:
      "Powered by Yjs CRDTs. Concurrent edits merge deterministically — no manual conflict resolution ever.",
    color: "#cba6f7",
    detail: "Deterministic merge",
  },
  {
    icon: Shield,
    title: "No Lock-In",
    description:
      "Open source and self-hostable. Your data never touches our servers. Run it on your own infrastructure.",
    color: "#f38ba8",
    detail: "Self-hostable",
  },
  {
    icon: Code2,
    title: "Monaco Editor",
    description:
      "Full VS Code editing experience — syntax highlighting, IntelliSense, multi-cursor, and 50+ languages.",
    color: "#94e2d5",
    detail: "50+ languages",
  },
];

export default function FeatureCards() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {FEATURES.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.04] ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            {/* Hover glow */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ backgroundColor: `${feature.color}15` }}
            />

            {/* Icon */}
            <div
              className="mb-4 inline-flex rounded-lg p-2.5 transition-colors duration-300"
              style={{
                backgroundColor: `${feature.color}10`,
                border: `1px solid ${feature.color}15`,
              }}
            >
              <Icon
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                style={{ color: feature.color }}
              />
            </div>

            {/* Title */}
            <h3 className="mb-2 text-[15px] font-semibold text-white/90">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-white/60">
              {feature.description}
            </p>

            {/* Detail badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `${feature.color}08`,
                color: `${feature.color}`,
                border: `1px solid ${feature.color}15`,
              }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: feature.color }}
              />
              {feature.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}
