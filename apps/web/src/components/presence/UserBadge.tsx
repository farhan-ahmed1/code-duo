"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@code-duo/shared/src/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserBadgeProps {
  user: User;
  isLocal?: boolean;
  connectedAt: number;
  onNameChange?: (name: string) => void;
}

/** Formats a millisecond duration into a human-readable string. */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
}

export default function UserBadge({
  user,
  isLocal = false,
  connectedAt,
  onNameChange,
}: UserBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [elapsed, setElapsed] = useState("just now");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the elapsed string up to date
  useEffect(() => {
    function update() {
      setElapsed(formatDuration(Date.now() - connectedAt));
    }
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [connectedAt]);

  // Sync editName when user.name changes externally
  useEffect(() => {
    if (!isEditing) setEditName(user.name);
  }, [user.name, isEditing]);

  // Auto-focus the input when editing begins
  useEffect(() => {
    if (isEditing) {
      // Timeout so the input is rendered before we focus
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isEditing]);

  function handleSubmit() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== user.name) {
      onNameChange?.(trimmed);
    } else {
      setEditName(user.name);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setEditName(user.name);
      setIsEditing(false);
    }
  }

  const badge = (
    <div
      data-testid="presence-user"
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200",
        "animate-in fade-in-0 slide-in-from-right-2 duration-300",
        isLocal
          ? "bg-gray-800/60 ring-1 ring-gray-700/40"
          : "hover:bg-gray-800/40",
        isLocal && !isEditing && "cursor-pointer",
      )}
      onClick={isLocal && !isEditing ? () => setIsEditing(true) : undefined}
      role={isLocal && !isEditing ? "button" : undefined}
      tabIndex={isLocal && !isEditing ? 0 : undefined}
      onKeyDown={
        isLocal && !isEditing
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") setIsEditing(true);
            }
          : undefined
      }
    >
      {/* Colored dot matching cursor color */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-gray-900"
        style={{ backgroundColor: user.color }}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
          placeholder="Your name"
          maxLength={20}
        />
      ) : (
        <span className="min-w-0 truncate text-gray-200">{user.name}</span>
      )}

      {isLocal && !isEditing && (
        <span className="ml-auto shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          you
        </span>
      )}
    </div>
  );

  // While editing, skip the tooltip so it doesn't interfere with the input
  if (isEditing) return badge;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground">Connected for {elapsed}</p>
          {isLocal && (
            <p className="mt-1 text-muted-foreground">Click to edit name</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
