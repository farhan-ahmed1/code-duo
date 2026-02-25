"use client";

import { useEffect, useRef, useState } from "react";
import { YJS_SETTINGS_KEY } from "@code-duo/shared";
import type { EditorLanguage, Room } from "@code-duo/shared";
import * as Y from "yjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Fetches room metadata from the REST API and keeps the active editor
 * language in sync via a shared Yjs `Y.Map`.
 *
 * On mount, it fetches the room's initial language from `GET /api/rooms/:id`.
 * If the Y.Map doesn't already contain a `language` key (first load for
 * the room), the hook seeds it with the value from the REST API so that
 * every subsequent observer picks up the correct initial language.
 *
 * It then observes the `"settings"` Y.Map on the shared document so that
 * language changes made by any user propagate to all peers in real time.
 *
 * @param roomId - The room whose metadata and settings to load.
 * @param ydoc   - The shared Yjs document for the room.  Pass `null`
 *   while the document hasn't been initialised yet.
 * @returns The room metadata (or `null` while loading), the currently
 *   active language, and a `setLanguage` function that broadcasts a
 *   language change to all peers via the shared Y.Map.
 */
export function useRoom(roomId: string, ydoc: Y.Doc | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [language, setLanguageState] = useState<EditorLanguage>("typescript");
  const seededRef = useRef(false);

  // Fetch room metadata on mount and seed Y.Map if empty
  useEffect(() => {
    seededRef.current = false;
    const controller = new AbortController();

    fetch(`${API_URL}/api/rooms/${roomId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: Room) => {
        setRoom(data);
        setLanguageState(data.language);

        // Seed the shared Y.Map with the API language when it hasn't been
        // set yet (first user to open the room since the doc was created).
        if (ydoc && !seededRef.current) {
          const settings = ydoc.getMap<string>(YJS_SETTINGS_KEY);
          if (!settings.has("language")) {
            settings.set("language", data.language);
          }
          seededRef.current = true;
        }
      })
      .catch((_err) => {
        // Room metadata fetch failed or was aborted — language will fall
        // back to default. The Y.Map will still sync the live value from
        // other peers.
      });

    return () => controller.abort();
  }, [roomId, ydoc]);

  // Observe Y.Map for real-time language changes
  useEffect(() => {
    if (!ydoc) return;
    const settings = ydoc.getMap<string>(YJS_SETTINGS_KEY);

    // Pick up any existing value that was set before this observer was registered
    const existing = settings.get("language") as EditorLanguage | undefined;
    if (existing) setLanguageState(existing);

    function handleChange() {
      const lang = settings.get("language") as EditorLanguage | undefined;
      if (lang) setLanguageState(lang);
    }

    settings.observe(handleChange);
    return () => settings.unobserve(handleChange);
  }, [ydoc]);

  /** Update the language in the shared Y.Map, broadcasting to all peers. */
  function setLanguage(lang: EditorLanguage) {
    if (!ydoc) return;
    const settings = ydoc.getMap<string>(YJS_SETTINGS_KEY);
    settings.set("language", lang);
  }

  return { room, language, setLanguage };
}
