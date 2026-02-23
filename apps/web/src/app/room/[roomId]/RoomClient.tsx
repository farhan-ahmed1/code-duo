"use client";

import { useYjs } from "@/hooks/useYjs";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import PresenceBar from "@/components/presence/PresenceBar";

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const { provider, ytext } = useYjs(roomId);
  const awareness = provider?.awareness ?? null;

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <EditorToolbar roomId={roomId} provider={provider} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor ytext={ytext} awareness={awareness} />
        </div>
        <PresenceBar awareness={awareness} />
      </div>
    </div>
  );
}
