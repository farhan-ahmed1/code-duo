import type { EditorLanguage } from "./types";

// Supported Monaco language IDs
export const SUPPORTED_LANGUAGES: EditorLanguage[] = [
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "c",
  "cpp",
  "java",
  "csharp",
  "ruby",
  "php",
  "html",
  "css",
  "json",
  "markdown",
];

export const DEFAULT_LANGUAGE: EditorLanguage = "typescript";

export const MAX_ROOM_NAME_LENGTH = 100;

// 12 distinct, accessible colors for user presence
export const USER_COLORS = [
  "#FF6B6B", // coral red
  "#4ECDC4", // teal
  "#45B7D1", // sky blue
  "#96CEB4", // sage green
  "#FFEAA7", // yellow
  "#DDA0DD", // plum
  "#98D8C8", // mint
  "#F7DC6F", // warm yellow
  "#BB8FCE", // lavender purple
  "#85C1E9", // light blue
  "#F1948A", // salmon
  "#82E0AA", // light green
] as const;

// WebSocket reconnection config
export const WS_RECONNECT_CONFIG = {
  maxBackoffTime: 2500,
  initialReconnectDelay: 100,
  maxReconnectDelay: 30_000,
  bcChannelName: "code-duo",
} as const;

// Room/document config
export const ROOM_ID_LENGTH = 8;
export const DOCUMENT_DEBOUNCE_MS = 2000;
export const ROOM_EXPIRY_DAYS = 7;
export const DEFAULT_PAGINATION_LIMIT = 20;

// Yjs shared type names
export const YJS_TEXT_KEY = "monaco";
export const YJS_SETTINGS_KEY = "settings";
