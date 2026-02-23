import { create } from 'zustand';
import type { EditorLanguage } from '@code-duo/shared/src/types';
import { DEFAULT_LANGUAGE } from '@code-duo/shared/src/constants';

interface EditorState {
  language: EditorLanguage;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  setLanguage: (language: EditorLanguage) => void;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setFontSize: (size: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  language: DEFAULT_LANGUAGE,
  theme: 'vs-dark',
  fontSize: 14,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
