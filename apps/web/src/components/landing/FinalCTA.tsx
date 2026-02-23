"use client";

import { useState } from "react";
import { Terminal, ArrowRight } from "lucide-react";

interface FinalCTAProps {
  onCreateRoom: () => void;
}

export default function FinalCTA({ onCreateRoom }: FinalCTAProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#89b4fa]/[0.08] via-[#cba6f7]/[0.05] to-[#a6e3a1]/[0.08]" />
      <div className="absolute inset-0 bg-[#0e0e16]/80 backdrop-blur-3xl" />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#89b4fa]/[0.06] blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#cba6f7]/[0.06] blur-[80px]" />

      <div className="relative flex flex-col items-center px-8 py-16 text-center md:py-20">
        {/* Terminal icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Terminal className="h-6 w-6 text-[#89b4fa]" />
        </div>

        <h2 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to code
          <span className="bg-gradient-to-r from-[#89b4fa] to-[#cba6f7] bg-clip-text text-transparent">
            {" "}together?
          </span>
        </h2>

        <p className="mt-4 max-w-sm text-base leading-relaxed text-white/40">
          Create a room in seconds. No sign-up, no setup, no friction.
          Just share the link and start collaborating.
        </p>

        <button
          onClick={onCreateRoom}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="group mt-8 flex items-center gap-3 rounded-xl bg-[#89b4fa] px-8 py-4 text-base font-semibold text-[#0e0e16] shadow-lg shadow-[#89b4fa]/20 transition-all hover:bg-[#b4befe] hover:shadow-[#b4befe]/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          Start a Session
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-300 ${
              hovered ? "translate-x-1" : ""
            }`}
          />
        </button>

        <p className="mt-4 text-xs text-white/20">
          Free & open source — no account required
        </p>
      </div>
    </div>
  );
}
