"use client";

import { useEffect, useState } from "react";
import { useYjs } from "@/hooks/useYjs";
import { useRoom } from "@/hooks/useRoom";
import { useAwareness } from "@/hooks/useAwareness";
import { useEditorStore } from "@/stores/editor-store";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceBar from "@/components/presence/PresenceBar";
import type { EditorLanguage } from "@code-duo/shared/src/types";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { ydoc, provider, ytext, awareness } = useYjs(roomId);
  const { language, setLanguage } = useRoom(roomId, ydoc);
  const { remoteUsers } = useAwareness(awareness);

  const theme = useEditorStore((s) => s.theme);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const storeSetLanguage = useEditorStore((s) => s.setLanguage);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Keep the Zustand store in sync with the Y.Map language so any
  // component reading from the store sees the shared value.
  useEffect(() => {
    storeSetLanguage(language);
  }, [language, storeSetLanguage]);

  // Auto-collapse on narrow viewports; re-expand when the screen grows
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setSidebarOpen(!mq.matches);
    function handleChange(e: MediaQueryListEvent) {
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
    <div className="flex h-screen flex-col bg-gray-950">
      <EditorToolbar
        roomId={roomId}
        provider={provider}
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        connectedUsers={connectedUsers}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor takes remaining width (~85% when sidebar open) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <CollaborativeEditor
            ytext={ytext}
            awareness={awareness}
            language={language}
            theme={theme}
          />
        </div>

        {/* Presence sidebar (~15% / 14rem when expanded, 2.5rem when collapsed) */}
        <PresenceBar
          awareness={awareness}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}
