"use client";

import { useState } from "react";
import CreateRoomDialog from "@/components/room/CreateRoomDialog";
import JoinRoomForm from "@/components/room/JoinRoomForm";

export default function HomePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
      {/* Subtle radial glow behind the content */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[480px] w-[480px] rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        {/* Logo + tagline */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            {/* Code bracket icon */}
            <span className="text-primary font-mono text-3xl font-bold select-none">&lt;/&gt;</span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Code Duo
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto">
            Real-time collaborative coding, powered by CRDTs.
            <br />
            <span className="text-muted-foreground/70">Fast. Minimal. No merge conflicts.</span>
          </p>
        </div>

        {/* Action cards */}
        <div className="w-full space-y-3">
          {/* Create Room card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="group w-full rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Create Room
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Start a new collaborative session
                </p>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="3" x2="8" y2="13" />
                  <line x1="3" y1="8" x2="13" y2="8" />
                </svg>
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Join Room form */}
          <JoinRoomForm />
        </div>

        {/* Footer hint */}
        <p className="text-[11px] text-muted-foreground/40 font-mono">
          v0.1.0 — open a room to start coding together
        </p>
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
