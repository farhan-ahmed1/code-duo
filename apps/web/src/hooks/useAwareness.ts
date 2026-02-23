'use client';

import { useEffect, useState } from 'react';
import { Awareness } from 'y-protocols/awareness';
import type { User, UserAwarenessState } from '@code-duo/shared/src/types';
import { generateColor } from '@/lib/colors';

const STORAGE_KEY = 'code-duo:username';

function getOrCreateUser(clientId: number): User {
  const storedName = localStorage.getItem(STORAGE_KEY);
  const name = storedName ?? `User-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  if (!storedName) localStorage.setItem(STORAGE_KEY, name);

  return {
    id: String(clientId),
    name,
    color: generateColor(clientId),
  };
}

export function useAwareness(awareness: Awareness | null) {
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!awareness) return;
    // Capture non-null reference so nested callbacks keep the narrowed type
    const aw = awareness;

    const user = getOrCreateUser(aw.clientID);
    setLocalUser(user);

    aw.setLocalStateField('user', user);

    function handleChange() {
      const states = Array.from(aw.getStates().entries()) as [number, UserAwarenessState][];
      const remote = states
        .filter(([id]) => id !== aw.clientID)
        .map(([, state]) => state.user)
        .filter(Boolean);
      setRemoteUsers(remote);
    }

    aw.on('change', handleChange);
    return () => aw.off('change', handleChange);
  }, [awareness]);

  function setUserName(name: string) {
    if (!awareness || !localUser) return;
    localStorage.setItem(STORAGE_KEY, name);
    const updated = { ...localUser, name };
    setLocalUser(updated);
    awareness.setLocalStateField('user', updated);
  }

  return { localUser, remoteUsers, setUserName };
}
