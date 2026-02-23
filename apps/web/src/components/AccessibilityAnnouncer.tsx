"use client";

import { useEffect, useRef, useState } from "react";
import type { ConnectionStatus } from "@code-duo/shared/src/types";
import type { PresenceUser } from "@/hooks/useAwareness";

interface AccessibilityAnnouncerProps {
  connectionStatus: ConnectionStatus;
  remoteUsers: PresenceUser[];
}

/**
 * Hidden live region that announces connection status changes and
 * user join/leave events to screen readers.
 *
 * Uses `aria-live="polite"` so announcements do not interrupt ongoing
 * screen reader speech.
 */
export default function AccessibilityAnnouncer({
  connectionStatus,
  remoteUsers,
}: AccessibilityAnnouncerProps) {
  const [announcement, setAnnouncement] = useState("");
  const prevStatusRef = useRef<ConnectionStatus>(connectionStatus);
  const prevUsersRef = useRef<Map<string, string>>(new Map());

  // Announce connection status changes
  useEffect(() => {
    if (connectionStatus === prevStatusRef.current) return;
    prevStatusRef.current = connectionStatus;

    const messages: Record<ConnectionStatus, string> = {
      connected: "Connected to collaboration server",
      connecting: "Reconnecting to collaboration server",
      disconnected:
        "Disconnected from collaboration server. Your edits are saved locally and will sync when reconnected.",
    };

    setAnnouncement(messages[connectionStatus]);
  }, [connectionStatus]);

  // Announce user join/leave events
  useEffect(() => {
    const currentMap = new Map(remoteUsers.map((u) => [u.id, u.name]));
    const prevMap = prevUsersRef.current;

    // Detect joins
    for (const user of remoteUsers) {
      if (!prevMap.has(user.id)) {
        setAnnouncement(`${user.name} joined the room`);
      }
    }

    // Detect leaves
    for (const [id, name] of prevMap) {
      if (!currentMap.has(id)) {
        setAnnouncement(`${name} left the room`);
      }
    }

    prevUsersRef.current = currentMap;
  }, [remoteUsers]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
