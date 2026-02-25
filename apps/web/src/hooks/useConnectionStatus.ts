"use client";

import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionStatus, SyncStatus } from "@code-duo/shared";

/**
 * Tracks the connection and sync status of a Yjs WebSocket provider.
 *
 * Listens to `status` events to determine whether the WebSocket is
 * `'connected'`, `'connecting'`, or `'disconnected'`, and to `sync`
 * events to distinguish between `'synced'` (initial state received from
 * server) and `'syncing'` (still loading).
 *
 * @param provider - The active WebSocket provider, or `null` while the
 *   hook is not yet connected.  Defaults to `'connecting'` / `'syncing'`
 *   until events arrive.
 * @returns The current connection status and sync status strings.
 */
export function useConnectionStatus(provider: WebsocketProvider | null) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("syncing");

  useEffect(() => {
    if (!provider) return;

    function handleStatus({ status: s }: { status: string }) {
      setStatus(s as ConnectionStatus);
    }

    function handleSync(isSynced: boolean) {
      setSyncStatus(isSynced ? "synced" : "syncing");
    }

    provider.on("status", handleStatus);
    provider.on("sync", handleSync);

    return () => {
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
    };
  }, [provider]);

  return { status, syncStatus };
}
