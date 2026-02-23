'use client';

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { YJS_TEXT_KEY } from '@code-duo/shared/src/constants';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

export function useYjs(roomId: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Local persistence for offline support and instant load
    const indexeddb = new IndexeddbPersistence(roomId, ydoc);

    // Remote WebSocket sync
    const provider = new WebsocketProvider(WS_URL, roomId, ydoc);
    providerRef.current = provider;

    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    return () => {
      indexeddb.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    ytext: ydocRef.current?.getText(YJS_TEXT_KEY) ?? null,
    isConnected,
  };
}
