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
  isCollapsible?: boolean;
  /** Called when a remote user is clicked — scrolls the editor to their cursor. */
  onScrollToUser?: (userId: string) => void;
}

export default function PresenceBar({
  awareness,
  isOpen,
  onToggle,
  isCollapsible = true,
  onScrollToUser,
}: PresenceBarProps) {
  const { localUser, remoteUsers, setUserName, isNewUser, localConnectedAt } =
    useAwareness(awareness);

  const [nameInput, setNameInput] = useState("");

  const totalCount = (localUser ? 1 : 0) + remoteUsers.length;
  const panelId = "presence-sidebar-panel";

  function handleNamePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      setNameInput("");
    }
  }

  return (
    <aside className="relative h-full w-full overflow-hidden border-l border-border bg-editor-panel/95 backdrop-blur-sm transition-colors duration-300">
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center py-3 transition-[opacity,transform] duration-200 ease-out",
          isOpen ? "pointer-events-none translate-x-2 opacity-0" : "translate-x-0 opacity-100",
        )}
        aria-hidden={isOpen}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Expand presence sidebar"
          aria-controls={panelId}
          aria-expanded={isOpen}
        >
          <PanelRightOpen className="h-4 w-4" />
          <div className="flex flex-col items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{totalCount}</span>
          </div>
        </button>
      </div>

      <div
        id={panelId}
        className={cn(
          "absolute inset-0 flex flex-col transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Online&ensp;·&ensp;{totalCount}
            </p>
          </div>
          {isCollapsible ? (
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Collapse presence sidebar"
              aria-controls={panelId}
              aria-expanded={isOpen}
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Name prompt for first-time users */}
        {isNewUser && (
          <div className="mx-3 mt-3 rounded-md border border-primary/20 bg-primary/8 p-2.5 animate-in fade-in-0 duration-300">
            <p className="mb-2 text-xs text-muted-foreground">
              What should we call you?
            </p>
            <form onSubmit={handleNamePromptSubmit} className="flex gap-1.5">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={localUser?.name ?? "Your name"}
                maxLength={20}
                aria-label="Set your display name"
                className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
              <button
                type="submit"
                className={cn(
                  "shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground",
                  "transition-opacity hover:opacity-90 disabled:opacity-40",
                )}
                disabled={!nameInput.trim()}
                aria-label="Save display name"
              >
                Set
              </button>
            </form>
          </div>
        )}

        {/* User list */}
        <div
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2"
          role="list"
          aria-label="Connected users"
        >
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
              onScrollTo={
                onScrollToUser ? () => onScrollToUser(user.id) : undefined
              }
            />
          ))}

          {totalCount === 1 && (
            <p className="mt-4 px-2 text-center text-xs text-muted-foreground/60">
              Share the room link to invite others
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
