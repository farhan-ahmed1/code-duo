"use client";

import { useState } from "react";
import { Users, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useAwareness } from "@/hooks/useAwareness";
import UserBadge from "./UserBadge";
import { cn } from "@/lib/utils";
import type { Awareness } from "y-protocols/awareness";

interface PresenceBarProps {
  awareness: Awareness | null;
  isOpen: boolean;
  onToggle: () => void;
}

export default function PresenceBar({
  awareness,
  isOpen,
  onToggle,
}: PresenceBarProps) {
  const { localUser, remoteUsers, setUserName, isNewUser, localConnectedAt } =
    useAwareness(awareness);

  const [nameInput, setNameInput] = useState("");

  const totalCount = (localUser ? 1 : 0) + remoteUsers.length;

  function handleNamePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      setNameInput("");
    }
  }

  // ── Collapsed state ────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <aside className="flex w-10 flex-col items-center border-l border-gray-800 bg-gray-900 py-3">
        <button
          onClick={onToggle}
          className="flex flex-col items-center gap-2 text-gray-400 transition-colors hover:text-gray-200"
          aria-label="Expand presence sidebar"
        >
          <PanelRightOpen className="h-4 w-4" />
          <div className="flex flex-col items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{totalCount}</span>
          </div>
        </button>
      </aside>
    );
  }

  // ── Expanded state ─────────────────────────────────────────────────
  return (
    <aside className="flex w-56 flex-col border-l border-gray-800 bg-gray-900 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-gray-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Online&ensp;·&ensp;{totalCount}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label="Collapse presence sidebar"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Name prompt for first-time users */}
      {isNewUser && (
        <div className="mx-3 mt-3 rounded-md bg-primary/10 p-2.5 animate-in fade-in-0 duration-300">
          <p className="mb-2 text-xs text-gray-400">
            What should we call you?
          </p>
          <form onSubmit={handleNamePromptSubmit} className="flex gap-1.5">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={localUser?.name ?? "Your name"}
              maxLength={20}
              className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 outline-none placeholder:text-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              autoFocus
            />
            <button
              type="submit"
              className={cn(
                "shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground",
                "transition-opacity hover:opacity-90 disabled:opacity-40",
              )}
              disabled={!nameInput.trim()}
            >
              Set
            </button>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {localUser && (
          <UserBadge
            key={localUser.id}
            user={localUser}
            isLocal
            connectedAt={localConnectedAt}
            onNameChange={setUserName}
          />
        )}
        {remoteUsers.map((user) => (
          <UserBadge
            key={user.id}
            user={user}
            connectedAt={user.connectedAt}
          />
        ))}

        {totalCount === 1 && (
          <p className="mt-4 px-2 text-center text-xs text-gray-600">
            Share the room link to invite others
          </p>
        )}
      </div>
    </aside>
  );
}
