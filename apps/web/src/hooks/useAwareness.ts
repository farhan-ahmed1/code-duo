"use client";

import { useEffect, useRef, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import type { User, UserAwarenessState } from "@code-duo/shared";
import { generateColor } from "@/lib/colors";

const STORAGE_KEY = "code-duo:username";
const STORAGE_KEY_ID = "code-duo:userid";
const NAME_SET_KEY = "code-duo:name-customised";

/** User enriched with connection timestamp for presence display. */
export interface PresenceUser extends User {
  connectedAt: number;
}

/**
 * Returns (or creates) a stable user ID that persists across page reloads.
 * This is intentionally decoupled from the ephemeral Yjs clientID so that
 * the same browser session always announces the same identity.
 */
function getOrCreateStableId(): string {
  const stored = localStorage.getItem(STORAGE_KEY_ID);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY_ID, id);
  return id;
}

function getOrCreateUser(): { user: User; isNew: boolean } {
  const id = getOrCreateStableId();
  const storedName = localStorage.getItem(STORAGE_KEY);
  const hasCustomised = localStorage.getItem(NAME_SET_KEY) === "true";
  const isNew = !hasCustomised;
  const name =
    storedName ??
    `User-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  if (!storedName) localStorage.setItem(STORAGE_KEY, name);

  return {
    // Use the stable ID — color is derived from it so it never changes across reloads
    user: { id, name, color: generateColor(id) },
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

    const { user, isNew } = getOrCreateUser();
    setLocalUser(user);
    setIsNewUser(isNew);

    aw.setLocalStateField("user", user);
    aw.setLocalStateField("connectedAt", connectedAt);

    // Capture local stable ID so handleChange can exclude stale ghost
    // entries from previous reloads of this same browser session. Those
    // ghosts have a different Yjs clientID but the same stable user.id.
    const localStableId = user.id;

    function handleChange() {
      const states = Array.from(aw.getStates().entries()) as [
        number,
        UserAwarenessState,
      ][];

      // Build a deduplicated map keyed by the stable user.id.
      // Filter out: (a) the current Yjs clientID (local session), and
      // (b) any stale ghost entries that share our stable ID — these are
      // leftover awareness entries from previous reloads whose WebSocket
      // closed before the awareness-null message could be sent.
      const byStableId = new Map<string, PresenceUser>();

      for (const [clientId, state] of states) {
        if (clientId === aw.clientID) continue;
        if (!state.user?.name) continue;
        if (state.user.id === localStableId) continue; // ghost from prior reload

        const candidate: PresenceUser = {
          ...state.user,
          connectedAt: state.connectedAt ?? Date.now(),
        };

        const existing = byStableId.get(state.user.id);
        if (!existing || candidate.connectedAt > existing.connectedAt) {
          byStableId.set(state.user.id, candidate);
        }
      }

      setRemoteUsers(Array.from(byStableId.values()));
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
