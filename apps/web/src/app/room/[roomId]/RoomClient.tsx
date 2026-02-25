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

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { ydoc, provider, ytext, awareness } = useYjs(roomId);
  const { language, setLanguage } = useRoom(roomId, ydoc);
  const { remoteUsers } = useAwareness(awareness);
  const { status: connectionStatus, syncStatus } = useConnectionStatus(provider);
  const { metrics } = usePerformanceMetrics(provider, ydoc);

  const theme = useEditorStore((s) => s.theme);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const storeSetLanguage = useEditorStore((s) => s.setLanguage);

  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
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
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    setSidebarOpen(!mq.matches);
    function handleChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
      setSidebarOpen(!e.matches);
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

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
        onThemeToggle={toggleTheme}
        connectedUsers={connectedUsers}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Editor takes remaining width (~85% when sidebar open) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <CollaborativeEditor
            ytext={ytext}
            awareness={awareness}
            provider={provider}
            language={language}
            theme={theme}
            onEditorReady={(editor) => { editorRef.current = editor; }}
          />
        </div>

        {/* Mobile: overlay sidebar; Desktop: inline sidebar */}
        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 z-10 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={
            isMobile
              ? `absolute right-0 top-0 z-20 h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`
              : ""
          }
        >
          <PresenceBar
            awareness={awareness}
            isOpen={isMobile ? true : sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
            onScrollToUser={handleScrollToUser}
          />
        </div>

        {/* Floating mobile toggle when sidebar is hidden */}
        {isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 shadow-lg ring-1 ring-gray-700 transition-all hover:bg-gray-700 hover:text-white active:scale-95"
            aria-label="Show presence bar"
          >
            <Users className="h-3.5 w-3.5" />
            <span>{connectedUsers}</span>
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
