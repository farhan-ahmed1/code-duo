"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "< 50ms", label: "Sync latency" },
  { value: "100%", label: "Conflict-free" },
  { value: "0 KB", label: "No data on our servers" },
  { value: "∞", label: "Concurrent editors" },
];

export default function StatsBar() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8"
    >
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`text-center transition-all duration-700 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            {stat.value}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-widest text-white/50">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
