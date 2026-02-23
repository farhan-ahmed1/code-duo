"use client";

import { useEffect, useState } from "react";
import { YJS_SETTINGS_KEY } from "@code-duo/shared/src/constants";
import type { EditorLanguage, Room } from "@code-duo/shared/src/types";
import * as Y from "yjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Fetches room metadata from the REST API and keeps the active editor
 * language in sync via a shared Yjs `Y.Map`.
 *
 * On mount, it fetches the room's initial language from `GET /api/rooms/:id`.
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

  // Fetch room metadata on mount
  useEffect(() => {
    fetch(`${API_URL}/api/rooms/${roomId}`)
      .then((res) => res.json())
      .then((data: Room) => {
        setRoom(data);
        setLanguageState(data.language);
      })
      .catch(console.error);
  }, [roomId]);

  // Observe Y.Map for real-time language changes
  useEffect(() => {
    if (!ydoc) return;
    const settings = ydoc.getMap<string>(YJS_SETTINGS_KEY);

    function handleChange() {
      const lang = settings.get("language") as EditorLanguage | undefined;
      if (lang) setLanguageState(lang);
    }

    settings.observe(handleChange);
    return () => settings.unobserve(handleChange);
  }, [ydoc]);

  function setLanguage(lang: EditorLanguage) {
    if (!ydoc) return;
    const settings = ydoc.getMap<string>(YJS_SETTINGS_KEY);
    settings.set("language", lang);
  }

  return { room, language, setLanguage };
}
