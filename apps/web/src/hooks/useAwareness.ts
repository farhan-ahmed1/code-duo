"use client";

import { useEffect, useRef, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import type { User, UserAwarenessState } from "@code-duo/shared/src/types";
import { generateColor } from "@/lib/colors";

const STORAGE_KEY = "code-duo:username";
const NAME_SET_KEY = "code-duo:name-customised";

/** User enriched with connection timestamp for presence display. */
export interface PresenceUser extends User {
  connectedAt: number;
}

function getOrCreateUser(clientId: number): { user: User; isNew: boolean } {
  const storedName = localStorage.getItem(STORAGE_KEY);
  const hasCustomised = localStorage.getItem(NAME_SET_KEY) === "true";
  const isNew = !hasCustomised;
  const name =
    storedName ??
    `User-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  if (!storedName) localStorage.setItem(STORAGE_KEY, name);

  return {
    user: { id: String(clientId), name, color: generateColor(clientId) },
    isNew,
  };
}

/**
 * Manages Yjs awareness state for the local user and tracks all remote
 * users connected to the same room.
 *
 * On mount it reads (or generates) a display name from localStorage,
 * assigns a deterministic color from the palette, and broadcasts the
 * user state to all peers.  Also broadcasts a `connectedAt` timestamp
 * so the presence bar can show how long each user has been connected.
 *
 * @param awareness - The awareness instance from the WebSocket provider.
 *   Pass `null` while the provider is not yet initialised; the hook is
 *   a no-op until a non-null value is provided.
 * @returns The local user object, arrays of remote users with connection
 *   timestamps, a setter to change the local display name, and a flag
 *   indicating whether the user has never customised their name.
 */
export function useAwareness(awareness: Awareness | null) {
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<PresenceUser[]>([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const connectedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!awareness) return;
    // Capture non-null reference so nested callbacks keep the narrowed type
    const aw = awareness;

    const connectedAt = Date.now();
    connectedAtRef.current = connectedAt;

    const { user, isNew } = getOrCreateUser(aw.clientID);
    setLocalUser(user);
    setIsNewUser(isNew);

    aw.setLocalStateField("user", user);
    aw.setLocalStateField("connectedAt", connectedAt);

    function handleChange() {
      const states = Array.from(aw.getStates().entries()) as [
        number,
        UserAwarenessState,
      ][];
      const remote = states
        .filter(([id]) => id !== aw.clientID)
        .map(([, state]) => ({
          ...(state.user ?? {}),
          connectedAt: state.connectedAt ?? Date.now(),
        }))
        .filter((u): u is PresenceUser => Boolean(u.name));
      setRemoteUsers(remote);
    }

    aw.on("change", handleChange);
    // Populate immediately so the list isn't empty until the first change
    handleChange();
    return () => aw.off("change", handleChange);
  }, [awareness]);

  function setUserName(name: string) {
    if (!awareness || !localUser) return;
    localStorage.setItem(STORAGE_KEY, name);
    localStorage.setItem(NAME_SET_KEY, "true");
    const updated = { ...localUser, name };
    setLocalUser(updated);
    setIsNewUser(false);
    awareness.setLocalStateField("user", updated);
  }

  return {
    localUser,
    remoteUsers,
    setUserName,
    isNewUser,
    localConnectedAt: connectedAtRef.current,
  };
}
