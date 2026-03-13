"use client";

import type { EditorLanguage } from "@code-duo/shared";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import ConnectionStatusIndicator from "@/components/editor/ConnectionStatusIndicator";
import LanguagePicker from "@/components/editor/LanguagePicker";
import ShareLinkButton from "@/components/room/ShareLinkButton";
import { Badge } from "@/components/ui/badge";
import type { WebsocketProvider } from "y-websocket";
import { Moon, Sun, Users, Home } from "lucide-react";
import Link from "next/link";

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

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-editor-chrome px-3 shadow-toolbar sm:px-4">
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
      <LanguagePicker
        language={language}
        onLanguageChange={onLanguageChange}
      />

      {/* Right-aligned controls */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          aria-label={`Switch to ${theme === "vs-dark" ? "light" : "dark"} theme`}
          onClick={onThemeToggle}
          className="rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <ConnectionStatusIndicator status={status} syncStatus={syncStatus} />

        {/* Share link */}
        <ShareLinkButton roomId={roomId} />
      </div>
    </header>
  );
}
