import { create } from "zustand";
import type { EditorLanguage } from "@code-duo/shared";
import { DEFAULT_LANGUAGE } from "@code-duo/shared";

const THEME_STORAGE_KEY = "code-duo:theme";

function getStoredTheme(): "vs-dark" | "light" {
  if (typeof window === "undefined") return "vs-dark";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "vs-dark";
}

interface EditorState {
  language: EditorLanguage;
  theme: "vs-dark" | "light";
  fontSize: number;
  setLanguage: (language: EditorLanguage) => void;
  setTheme: (theme: "vs-dark" | "light") => void;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
}

/**
 * Zustand store for local editor UI state.
 *
 * Holds the active language, colour theme, and font size.  Language is
 * also mirrored in the shared Yjs `Y.Map` (see `useRoom`), so changing
 * it here and broadcasting via `useRoom.setLanguage` keeps all peers
 * in sync.  Theme and font size are local-only preferences persisted
 * to localStorage.
 */
export const useEditorStore = create<EditorState>((set) => ({
  language: DEFAULT_LANGUAGE,
  theme: getStoredTheme(),
  fontSize: 14,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "vs-dark" ? "light" : "vs-dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return { theme: next };
    }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
