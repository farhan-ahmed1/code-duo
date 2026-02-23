"use client";

import { useAwareness } from "@/hooks/useAwareness";
import UserBadge from "./UserBadge";
import type { Awareness } from "y-protocols/awareness";

interface PresenceBarProps {
  awareness: Awareness | null;
}

export default function PresenceBar({ awareness }: PresenceBarProps) {
  const { localUser, remoteUsers } = useAwareness(awareness);
  const allUsers = localUser
    ? [
        { ...localUser, isLocal: true },
        ...remoteUsers.map((u) => ({ ...u, isLocal: false })),
      ]
    : [];

  return (
    <aside className="flex w-48 flex-col gap-2 border-l border-gray-800 bg-gray-900 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Online · {allUsers.length}
      </p>
      <div className="flex flex-col gap-1">
        {allUsers.map((user) => (
          <UserBadge key={user.id} user={user} isLocal={user.isLocal} />
        ))}
      </div>
    </aside>
  );
}
