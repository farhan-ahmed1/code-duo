"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useYjs } from "@/hooks/useYjs";
import { useRoom } from "@/hooks/useRoom";
import { useAwareness } from "@/hooks/useAwareness";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";
import { useEditorStore } from "@/stores/editor-store";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceBar from "@/components/presence/PresenceBar";
import DebugPanel from "@/components/editor/DebugPanel";
import AccessibilityAnnouncer from "@/components/AccessibilityAnnouncer";
import type { EditorLanguage } from "@code-duo/shared";
import { YJS_TEXT_KEY } from "@code-duo/shared";
import { Users } from "lucide-react";
import { useTheme } from "next-themes";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { ydoc, provider, ytext, awareness } = useYjs(roomId);
  const { language, setLanguage } = useRoom(roomId, ydoc);
  const { remoteUsers } = useAwareness(awareness);
  const { status: connectionStatus, syncStatus } =
    useConnectionStatus(provider);
  const { metrics } = usePerformanceMetrics(provider, ydoc);
  const { resolvedTheme, setTheme } = useTheme();

  const storeSetLanguage = useEditorStore((s) => s.setLanguage);
  const theme = resolvedTheme === "light" ? "light" : "vs-dark";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  /** Smooth-scroll the editor to a remote user's cursor position. */
  const handleScrollToUser = useCallback(
    (userId: string) => {
      if (!awareness || !editorRef.current || !ydoc) return;

      const editor = editorRef.current;
      const ytext = ydoc.getText(YJS_TEXT_KEY);

      // Find the awareness clientId for this stable userId
      for (const [_clientId, state] of awareness.getStates()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = state as any;
        if (s.user?.id !== userId || !s.selection?.head) continue;

        try {
          const headAbs = Y.createAbsolutePositionFromRelativePosition(
            s.selection.head,
            ytext.doc!,
          );
          if (!headAbs) continue;

          const model = editor.getModel();
          if (!model) continue;

          const position = model.getPositionAt(headAbs.index);
          editor.revealPositionInCenter(position, 0 /* Smooth */);
          editor.setPosition(position);
          editor.focus();
          break;
        } catch {
          // Skip if the position can't be resolved
        }
      }
    },
    [awareness, ydoc],
  );

  // Toggle debug panel with Ctrl/Cmd + Shift + D
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "d"
      ) {
        e.preventDefault();
        setDebugOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Confirmation dialog when closing a tab with content
  // CRDTs auto-save, but users expect this safeguard
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (ytext && ytext.length > 0) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [ytext]);

  // Keep the Zustand store in sync with the Y.Map language so any
  // component reading from the store sees the shared value.
  useEffect(() => {
    storeSetLanguage(language);
  }, [language, storeSetLanguage]);

  // Auto-collapse on narrow viewports; re-expand when the screen grows
  useEffect(() => {
    const compactMq = window.matchMedia("(max-width: 1023px)");
    const mobileMq = window.matchMedia("(max-width: 640px)");

    function syncLayoutState() {
      const compact = compactMq.matches;
      const mobile = mobileMq.matches;
      setIsCompactLayout(compact);
      setIsMobile(mobile);
      setSidebarOpen(!compact);
    }

    syncLayoutState();
    compactMq.addEventListener("change", syncLayoutState);
    mobileMq.addEventListener("change", syncLayoutState);
    return () => {
      compactMq.removeEventListener("change", syncLayoutState);
      mobileMq.removeEventListener("change", syncLayoutState);
    };
  }, []);

  function handleThemeToggle() {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }

  /** Update language in both Y.Map (shared) and Zustand store (local). */
  function handleLanguageChange(lang: EditorLanguage) {
    setLanguage(lang);
    storeSetLanguage(lang);
  }

  // +1 for the local user
  const connectedUsers = remoteUsers.length + 1;

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorToolbar
        roomId={roomId}
        provider={provider}
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        connectedUsers={connectedUsers}
      />

      <div className="relative flex flex-1 overflow-hidden bg-editor">
        {/* Editor takes remaining width (~85% when sidebar open) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <CollaborativeEditor
            ytext={ytext}
            awareness={awareness}
            provider={provider}
            language={language}
            theme={theme}
            onEditorReady={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        {/* Tablet/mobile: overlay sidebar; Desktop: inline sidebar */}
        <div
          className={`absolute inset-0 z-10 bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCompactLayout && sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={
            isCompactLayout
              ? `absolute right-2 top-2 bottom-2 z-20 w-[min(15rem,calc(100vw-1.5rem))] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-60 ${sidebarOpen ? "translate-x-0" : "translate-x-[110%]"}`
              : `relative h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarOpen ? "w-[clamp(15rem,15vw,18.75rem)]" : "w-10"}`
          }
        >
          <PresenceBar
            awareness={awareness}
            isOpen={isCompactLayout ? true : sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
            isCollapsible
            onScrollToUser={handleScrollToUser}
          />
        </div>

        {/* Floating mobile toggle when sidebar is hidden */}
        {isCompactLayout && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-foreground shadow-panel transition-all hover:bg-accent active:scale-95"
            aria-label="Show presence bar"
          >
            <Users className="h-3.5 w-3.5" />
            <span>{isMobile ? connectedUsers : `Presence ${connectedUsers}`}</span>
          </button>
        )}

        {/* Debug panel — toggled via Ctrl/Cmd + Shift + D */}
        <DebugPanel
          metrics={metrics}
          connectionStatus={connectionStatus}
          syncStatus={syncStatus}
          visible={debugOpen}
          onClose={() => setDebugOpen(false)}
        />
      </div>

      {/* Screen reader announcements for connection & presence changes */}
      <AccessibilityAnnouncer
        connectionStatus={connectionStatus}
        remoteUsers={remoteUsers}
      />
    </div>
  );
}
