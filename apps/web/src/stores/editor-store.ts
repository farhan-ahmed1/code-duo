import { create } from "zustand";
import type { EditorLanguage } from "@code-duo/shared/src/types";
import { DEFAULT_LANGUAGE } from "@code-duo/shared/src/constants";

interface EditorState {
  language: EditorLanguage;
  theme: "vs-dark" | "light";
  fontSize: number;
  setLanguage: (language: EditorLanguage) => void;
  setTheme: (theme: "vs-dark" | "light") => void;
  setFontSize: (size: number) => void;
}

/**
 * Zustand store for local editor UI state.
 *
 * Holds the active language, colour theme, and font size.  Language is
 * also mirrored in the shared Yjs `Y.Map` (see `useRoom`), so changing
 * it here and broadcasting via `useRoom.setLanguage` keeps all peers
 * in sync.  Theme and font size are local-only preferences.
 */
export const useEditorStore = create<EditorState>((set) => ({
  language: DEFAULT_LANGUAGE,
  theme: "vs-dark",
  fontSize: 14,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
