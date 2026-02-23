"use client";

import type { User } from "@code-duo/shared/src/types";

interface UserBadgeProps {
  user: User;
  isLocal?: boolean;
}

export default function UserBadge({ user, isLocal = false }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-800">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: user.color }}
      />
      <span className="truncate text-gray-200">{user.name}</span>
      {isLocal && <span className="ml-auto text-xs text-gray-500">you</span>}
    </div>
  );
}
