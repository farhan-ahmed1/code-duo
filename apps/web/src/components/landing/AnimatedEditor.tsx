"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematic animated code editor mock with two live cursors typing simultaneously.
 * Features a realistic VS-Code-like chrome, syntax highlighting, floating user
 * avatars, and a dramatic glow presentation.
 */

const CODE_LINES = [
  { text: 'import { Doc } from "yjs";', delay: 0 },
  { text: 'import { WebsocketProvider } from "y-websocket";', delay: 400 },
  { text: "", delay: 800 },
  { text: "const doc = new Doc();", delay: 1000 },
  {
    text: 'const provider = new WebsocketProvider("wss://codeduo.dev", "room-1", doc);',
    delay: 1400,
  },
  { text: "", delay: 2000 },
  { text: "// Real-time collaboration — zero conflicts", delay: 2200 },
  { text: 'const text = doc.getText("editor");', delay: 2800 },
  { text: "text.observe(() => {", delay: 3200 },
  { text: '  console.log("synced:", text.toString());', delay: 3600 },
  { text: "});", delay: 4000 },
];

const TABS = [
  { name: "collab.ts", active: true },
  { name: "room.ts", active: false },
  { name: "types.ts", active: false },
];

function syntaxHighlight(text: string) {
  return text
    .replace(
      /\b(import|from|const|new|function|return|export)\b/g,
      '<span class="text-[#c586c0]">$1</span>'
    )
    .replace(
      /("[^"]*"|'[^']*')/g,
      '<span class="text-[#ce9178]">$1</span>'
    )
    .replace(/(\/\/.*)/, '<span class="text-[#6a9955]">$1</span>')
    .replace(
      /\b(Doc|WebsocketProvider)\b/g,
      '<span class="text-[#4ec9b0]">$1</span>'
    )
    .replace(
      /\b(console|text|doc|provider)\b/g,
      '<span class="text-[#9cdcfe]">$1</span>'
    )
    .replace(
      /\.(observe|getText|toString|log)\b/g,
      '.<span class="text-[#dcdcaa]">$1</span>'
    );
}

export default function AnimatedEditor() {
  const [visibleChars, setVisibleChars] = useState<number[]>(
    CODE_LINES.map(() => 0)
  );
  const [started, setStarted] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          setTimeout(() => setStarted(true), 400);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    CODE_LINES.forEach((line, lineIdx) => {
      const total = line.text.length;
      for (let i = 1; i <= total; i++) {
        const t = setTimeout(() => {
          setVisibleChars((prev) => {
            const next = [...prev];
            next[lineIdx] = i;
            return next;
          });
        }, line.delay + i * 28);
        timers.push(t);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [started]);

  const cursorALines = [0, 1, 3, 4];
  const cursorBLines = [6, 7, 8, 9, 10];

  function getCursorPos(lines: number[]) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const idx = lines[i];
      if (
        visibleChars[idx] > 0 &&
        visibleChars[idx] < CODE_LINES[idx].text.length
      ) {
        return { line: idx, char: visibleChars[idx] };
      }
    }
    const last = lines[lines.length - 1];
    return { line: last, char: visibleChars[last] };
  }

  const cursorA = getCursorPos(cursorALines);
  const cursorB = getCursorPos(cursorBLines);

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-3xl mx-auto transition-all duration-1000 ${
        sectionVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0"
      }`}
    >
      {/* Multi-layered glow */}
      <div className="absolute -inset-8 rounded-3xl bg-[#89b4fa]/[0.04] blur-[60px] pointer-events-none" />
      <div className="absolute -inset-4 rounded-2xl bg-[#cba6f7]/[0.03] blur-[40px] pointer-events-none" />
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-[#89b4fa]/20 via-transparent to-[#cba6f7]/10 pointer-events-none" />

      {/* Floating user badges */}
      <div className="absolute -left-3 top-24 z-20 hidden lg:flex items-center gap-2 rounded-full border border-[#89b4fa]/20 bg-[#181825]/90 px-3 py-1.5 shadow-lg shadow-black/30 backdrop-blur-sm animate-float">
        <div className="h-5 w-5 rounded-full bg-[#89b4fa] flex items-center justify-center text-[9px] font-bold text-[#0e0e16]">
          A
        </div>
        <span className="text-[11px] font-medium text-[#89b4fa]/80">
          Alice
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#a6e3a1] animate-pulse" />
      </div>

      <div className="absolute -right-3 top-40 z-20 hidden lg:flex items-center gap-2 rounded-full border border-[#a6e3a1]/20 bg-[#181825]/90 px-3 py-1.5 shadow-lg shadow-black/30 backdrop-blur-sm animate-float animation-delay-500">
        <div className="h-5 w-5 rounded-full bg-[#a6e3a1] flex items-center justify-center text-[9px] font-bold text-[#0e0e16]">
          B
        </div>
        <span className="text-[11px] font-medium text-[#a6e3a1]/80">Bob</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#a6e3a1] animate-pulse" />
      </div>

      {/* Editor window */}
      <div className="relative rounded-xl border border-white/[0.08] bg-[#1e1e2e] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#181825] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#f38ba8]/80 transition-colors hover:bg-[#f38ba8]" />
            <span className="h-3 w-3 rounded-full bg-[#f9e2af]/80 transition-colors hover:bg-[#f9e2af]" />
            <span className="h-3 w-3 rounded-full bg-[#a6e3a1]/80 transition-colors hover:bg-[#a6e3a1]" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/20">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            codeduo — collab.ts
          </div>
          <div className="flex-1" />
          {/* Mini presence dots */}
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#89b4fa] ring-2 ring-[#181825]" />
            <span className="-ml-1 h-2 w-2 rounded-full bg-[#a6e3a1] ring-2 ring-[#181825]" />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] bg-[#181825]">
          {TABS.map((tab) => (
            <div
              key={tab.name}
              className={`relative px-4 py-1.5 text-[11px] font-mono border-r border-white/[0.04] transition-colors ${
                tab.active
                  ? "bg-[#1e1e2e] text-white/70"
                  : "text-white/25 hover:text-white/40"
              }`}
            >
              {tab.active && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#89b4fa]" />
              )}
              {tab.name}
            </div>
          ))}
          <div className="flex-1 bg-[#181825]" />
        </div>

        {/* Code area */}
        <div className="flex min-h-[300px] font-mono text-[13px] leading-6">
          {/* Line numbers */}
          <div className="select-none border-r border-white/[0.04] bg-[#181825]/50 px-3 py-3 text-right text-white/15">
            {CODE_LINES.map((_, i) => (
              <div key={i} className="transition-colors hover:text-white/30">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 py-3 pl-4 pr-4 overflow-x-auto">
            {CODE_LINES.map((line, lineIdx) => {
              const shown = line.text.slice(0, visibleChars[lineIdx]);
              const highlighted = syntaxHighlight(shown);
              const showCursorA = cursorA.line === lineIdx;
              const showCursorB = cursorB.line === lineIdx;

              return (
                <div key={lineIdx} className="relative whitespace-pre group">
                  {/* Active line highlight */}
                  {(showCursorA || showCursorB) &&
                    visibleChars[lineIdx] < line.text.length && (
                      <div className="absolute inset-0 -left-4 bg-white/[0.02] rounded-sm" />
                    )}
                  <span
                    className="relative text-[#cdd6f4]"
                    dangerouslySetInnerHTML={{
                      __html: highlighted || "&nbsp;",
                    }}
                  />
                  {showCursorA &&
                    visibleChars[lineIdx] < line.text.length && (
                      <span className="inline-block w-[2px] h-[18px] bg-[#89b4fa] animate-cursor-blink align-text-bottom ml-[1px] -mb-[2px] relative shadow-[0_0_8px_rgba(137,180,250,0.4)]">
                        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#89b4fa] px-1.5 py-0.5 text-[9px] font-sans font-medium text-[#1e1e2e]">
                          Alice
                        </span>
                      </span>
                    )}
                  {showCursorB &&
                    visibleChars[lineIdx] < line.text.length && (
                      <span className="inline-block w-[2px] h-[18px] bg-[#a6e3a1] animate-cursor-blink align-text-bottom ml-[1px] -mb-[2px] relative shadow-[0_0_8px_rgba(166,227,161,0.4)]">
                        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#a6e3a1] px-1.5 py-0.5 text-[9px] font-sans font-medium text-[#1e1e2e]">
                          Bob
                        </span>
                      </span>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#89b4fa]/[0.04] px-4 py-1 text-[10px] text-white/25">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a6e3a1] shadow-[0_0_4px_rgba(166,227,161,0.6)]" />
              Connected
            </span>
            <span className="text-white/15">|</span>
            <span className="flex items-center gap-1">
              <svg
                className="h-2.5 w-2.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              2 users
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>TypeScript</span>
            <span>UTF-8</span>
            <span>LF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
