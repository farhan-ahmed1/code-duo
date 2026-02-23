"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { YJS_TEXT_KEY, WS_RECONNECT_CONFIG } from "@code-duo/shared/src/constants";

// Server accepts WebSocket upgrades only on /yjs/* paths
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";
const WS_URL = `${WS_BASE}/yjs`;

/**
 * Initialises a Yjs collaborative document for the given room.
 *
 * Creates a Y.Doc, a WebSocket provider that syncs with the backend
 * (`/yjs/<roomId>`), and an IndexedDB provider for offline persistence
 * and instant load from local cache.
 *
 * @param roomId - The room ID to sync with. Changing this value tears
 *   down the current doc/provider pair and creates a fresh one.
 * @returns The live Y.Doc, WebSocket provider, shared Y.Text instance,
 *   and a boolean indicating whether the WebSocket is currently connected.
 */
export function useYjs(roomId: string) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const text = doc.getText(YJS_TEXT_KEY);

    // Local persistence for offline support and instant load
    const indexeddb = new IndexeddbPersistence(roomId, doc);

    // Remote WebSocket sync — connects to ws://host/yjs/<roomId>
    // Reconnection uses exponential backoff configured in shared constants.
    const wsProvider = new WebsocketProvider(WS_URL, roomId, doc, {
      maxBackoffTime: WS_RECONNECT_CONFIG.maxBackoffTime,
    });

    wsProvider.on("status", ({ status }: { status: string }) => {
      setIsConnected(status === "connected");
    });

    // Set state so consumers re-render and pick up live instances
    setYdoc(doc);
    setProvider(wsProvider);
    setYtext(text);

    return () => {
      indexeddb.destroy();
      wsProvider.destroy();
      doc.destroy();
      setYdoc(null);
      setProvider(null);
      setYtext(null);
      setIsConnected(false);
    };
  }, [roomId]);

  return { ydoc, provider, ytext, isConnected, awareness: provider?.awareness ?? null };
}
