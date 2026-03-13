"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { ConnectionStatus, SyncStatus } from "@code-duo/shared";

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  syncStatus: SyncStatus;
}

export default function ConnectionStatusIndicator({
  status,
  syncStatus,
}: ConnectionStatusIndicatorProps) {
  const isSyncing =
    status === "connecting" ||
    (status === "connected" && syncStatus === "syncing");

  const toneClass = (() => {
    if (status === "disconnected") return "bg-status-offline";
    if (isSyncing) return "bg-status-syncing animate-pulse";
    return "bg-status-connected";
  })();

  const label = (() => {
    if (status === "disconnected") {
      return "Offline — edits will sync when reconnected";
    }
    if (isSyncing) {
      return "Syncing changes";
    }
    return "Connected";
  })();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex cursor-help items-center gap-1.5 text-xs text-muted-foreground"
            role="status"
            aria-label={`Connection status: ${label}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${toneClass}`}
              aria-hidden="true"
            />
            <span className="hidden md:inline">{label}</span>
            <HelpCircle className="h-3 w-3 opacity-50" aria-hidden="true" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="max-w-[17rem]">
          <p className="font-medium">
            Powered by CRDTs (Conflict-free Replicated Data Types)
          </p>
          <p className="mt-1 text-muted-foreground">
            Yjs keeps collaborators converged without server-side conflict
            resolution. If the connection drops, local edits continue and sync on
            reconnection.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}