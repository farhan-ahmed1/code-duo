"use client";

import { useEffect, useState } from "react";
import { useYjs } from "@/hooks/useYjs";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceBar from "@/components/presence/PresenceBar";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { provider, ytext, awareness } = useYjs(roomId);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <EditorToolbar roomId={roomId} provider={provider} />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor takes remaining width (~85% when sidebar open) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <CollaborativeEditor ytext={ytext} awareness={awareness} />
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
