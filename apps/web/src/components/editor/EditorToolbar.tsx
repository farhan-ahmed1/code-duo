"use client";

import { SUPPORTED_LANGUAGES } from "@code-duo/shared/src/constants";
import type { EditorLanguage } from "@code-duo/shared/src/types";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import ShareLinkButton from "@/components/room/ShareLinkButton";
import { Badge } from "@/components/ui/badge";
import type { WebsocketProvider } from "y-websocket";
import { Moon, Sun, Users } from "lucide-react";

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
    if (isSyncing) return "bg-yellow-500";
    return "bg-green-500";
  })();

  const statusLabel = (() => {
    if (status === "disconnected")
      return "Offline — edits will sync when reconnected";
    if (isSyncing) return "Syncing…";
    return "Connected";
  })();

  return (
    <header className="flex h-12 items-center gap-4 border-b border-gray-800 bg-gray-900 px-4">
      {/* Brand */}
      <span className="text-sm font-semibold text-gray-200">Code Duo</span>

      {/* Language dropdown */}
      <select
        aria-label="Editor language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
        className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
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
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
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
          className="flex items-center gap-1 bg-gray-800 text-gray-300"
        >
          <Users className="h-3 w-3" />
          <span>{connectedUsers}</span>
        </Badge>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="hidden sm:inline">{statusLabel}</span>
        </div>

        {/* Share link */}
        <ShareLinkButton roomId={roomId} />
      </div>
    </header>
  );
}
