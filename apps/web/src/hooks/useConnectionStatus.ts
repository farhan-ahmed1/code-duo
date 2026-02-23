'use client';

import { useEffect, useState } from 'react';
import type { WebsocketProvider } from 'y-websocket';
import type { ConnectionStatus, SyncStatus } from '@code-duo/shared/src/types';

export function useConnectionStatus(provider: WebsocketProvider | null) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');

  useEffect(() => {
    if (!provider) return;

    function handleStatus({ status: s }: { status: string }) {
      setStatus(s as ConnectionStatus);
    }

    function handleSync(isSynced: boolean) {
      setSyncStatus(isSynced ? 'synced' : 'syncing');
    }

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
    };
  }, [provider]);

  return { status, syncStatus };
}
