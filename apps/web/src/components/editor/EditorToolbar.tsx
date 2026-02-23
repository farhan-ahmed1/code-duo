"use client";

import { SUPPORTED_LANGUAGES } from "@code-duo/shared/src/constants";
import type { EditorLanguage } from "@code-duo/shared/src/types";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import ShareLinkButton from "@/components/room/ShareLinkButton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WebsocketProvider } from "y-websocket";
import { Moon, Sun, Users, Home, HelpCircle } from "lucide-react";
import Link from "next/link";

/** Human-readable labels for languages in the dropdown. */
const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  java: "Java",
  csharp: "C#",
  ruby: "Ruby",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
};

interface EditorToolbarProps {
  roomId: string;
  provider: WebsocketProvider | null;
  language: EditorLanguage;
  onLanguageChange: (lang: EditorLanguage) => void;
  theme: "vs-dark" | "light";
  onThemeToggle: () => void;
  connectedUsers: number;
}

/**
 * Top toolbar for the editor page.
 *
 * Shows:
 * - Language dropdown (synced via Y.Map to all peers)
 * - Theme toggle (light/dark, stored in localStorage)
 * - Connected user count badge
 * - Connection status indicator
 * - Share-link button
 */
export default function EditorToolbar({
  roomId,
  provider,
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  connectedUsers,
}: EditorToolbarProps) {
  const { status, syncStatus } = useConnectionStatus(provider);

  // Derive the visual indicator from both connection and sync state:
  //  - Green: connected AND initial sync complete
  //  - Yellow: connecting, OR connected but still syncing
  //  - Red: disconnected (offline)
  const isSyncing =
    status === "connecting" ||
    (status === "connected" && syncStatus === "syncing");

  const statusColor = (() => {
    if (status === "disconnected") return "bg-red-500";
    if (isSyncing) return "bg-yellow-500 animate-pulse";
    return "bg-green-500";
  })();

  const statusLabel = (() => {
    if (status === "disconnected")
      return "Offline — edits will sync when reconnected";
    if (isSyncing) return "Syncing…";
    return "Connected";
  })();

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      {/* Brand / Home */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        aria-label="Back to home"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Code Duo</span>
      </Link>

      <div className="h-4 w-px bg-border" />

      {/* Language dropdown */}
      <select
        aria-label="Editor language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
        className="rounded border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground outline-none transition-colors focus:ring-1 focus:ring-ring"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>

      {/* Right-aligned controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* Theme toggle */}
        <button
          aria-label={`Switch to ${theme === "vs-dark" ? "light" : "dark"} theme`}
          onClick={onThemeToggle}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "vs-dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Connected user count */}
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-secondary text-secondary-foreground"
        >
          <Users className="h-3 w-3" />
          <span>{connectedUsers}</span>
        </Badge>

        {/* Connection status with "What's this?" tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex cursor-help items-center gap-1.5 text-xs text-muted-foreground"
                role="status"
                aria-label={`Connection status: ${statusLabel}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusColor}`} aria-hidden="true" />
                <span className="hidden sm:inline">{statusLabel}</span>
                <HelpCircle className="h-3 w-3 opacity-50" aria-hidden="true" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p className="font-medium">Powered by CRDTs (Conflict-free Replicated Data Types)</p>
              <p className="mt-1 text-muted-foreground">
                Your edits are synced in real-time using Yjs, a CRDT library that
                guarantees all collaborators converge to the same document state —
                even after network interruptions. No server-side conflict resolution needed.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Share link */}
        <ShareLinkButton roomId={roomId} />
      </div>
    </header>
  );
}
