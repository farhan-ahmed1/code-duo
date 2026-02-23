"use client";

import { SUPPORTED_LANGUAGES } from "@code-duo/shared/src/constants";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import ShareLinkButton from "@/components/room/ShareLinkButton";
import type { WebsocketProvider } from "y-websocket";

interface EditorToolbarProps {
  roomId: string;
  provider: WebsocketProvider | null;
}

export default function EditorToolbar({
  roomId,
  provider,
}: EditorToolbarProps) {
  const { status } = useConnectionStatus(provider);

  const statusColor =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-500"
        : "bg-red-500";

  const statusLabel =
    status === "connected"
      ? "Connected"
      : status === "connecting"
        ? "Connecting..."
        : "Offline";

  return (
    <header className="flex h-12 items-center gap-4 border-b border-gray-800 bg-gray-900 px-4">
      <span className="text-sm font-semibold text-gray-200">Code Duo</span>

      <select className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          {statusLabel}
        </div>
        <ShareLinkButton roomId={roomId} />
      </div>
    </header>
  );
}
