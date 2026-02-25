import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  MAX_ROOM_NAME_LENGTH,
  USER_COLORS,
  WS_RECONNECT_CONFIG,
  ROOM_ID_LENGTH,
  DOCUMENT_DEBOUNCE_MS,
  ROOM_EXPIRY_DAYS,
  DEFAULT_PAGINATION_LIMIT,
  YJS_TEXT_KEY,
  YJS_SETTINGS_KEY,
} from "../src/constants";
import type { EditorLanguage } from "../src/types";

// Monaco language IDs recognized by monaco.editor.setModelLanguage
const VALID_MONACO_LANGUAGE_IDS = new Set([
  "javascript",
  "typescript",
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
  "plaintext",
  "sql",
  "shell",
  "yaml",
  "xml",
  "swift",
  "kotlin",
  "dart",
  "lua",
  "r",
  "perl",
  "scala",
]);

describe("constants", () => {
  describe("SUPPORTED_LANGUAGES", () => {
    it("is a non-empty array", () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
    });

    it("contains the default language", () => {
      expect(SUPPORTED_LANGUAGES).toContain(DEFAULT_LANGUAGE);
    });

    it("all entries are valid Monaco language IDs", () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(VALID_MONACO_LANGUAGE_IDS).toContain(lang);
      }
    });

    it("has no duplicate entries", () => {
      const unique = new Set(SUPPORTED_LANGUAGES);
      expect(unique.size).toBe(SUPPORTED_LANGUAGES.length);
    });

    it("includes common languages (typescript, javascript, python)", () => {
      expect(SUPPORTED_LANGUAGES).toContain("typescript");
      expect(SUPPORTED_LANGUAGES).toContain("javascript");
      expect(SUPPORTED_LANGUAGES).toContain("python");
    });
  });

  describe("DEFAULT_LANGUAGE", () => {
    it("is typescript", () => {
      expect(DEFAULT_LANGUAGE).toBe("typescript");
    });
  });

  describe("MAX_ROOM_NAME_LENGTH", () => {
    it("is a positive number", () => {
      expect(MAX_ROOM_NAME_LENGTH).toBeGreaterThan(0);
    });

    it("is 100", () => {
      expect(MAX_ROOM_NAME_LENGTH).toBe(100);
    });
  });

  describe("USER_COLORS", () => {
    it("has 12 colors", () => {
      expect(USER_COLORS).toHaveLength(12);
    });

    it("all colors are valid hex strings", () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      for (const color of USER_COLORS) {
        expect(color).toMatch(hexPattern);
      }
    });

    it("all colors are unique", () => {
      const unique = new Set(USER_COLORS);
      expect(unique.size).toBe(USER_COLORS.length);
    });
  });

  describe("WS_RECONNECT_CONFIG", () => {
    it("has positive maxBackoffTime", () => {
      expect(WS_RECONNECT_CONFIG.maxBackoffTime).toBeGreaterThan(0);
    });

    it("has reasonable reconnect delays", () => {
      expect(WS_RECONNECT_CONFIG.initialReconnectDelay).toBeGreaterThan(0);
      expect(WS_RECONNECT_CONFIG.maxReconnectDelay).toBeGreaterThan(
        WS_RECONNECT_CONFIG.initialReconnectDelay,
      );
    });
  });

  describe("ROOM_ID_LENGTH", () => {
    it("is 8", () => {
      expect(ROOM_ID_LENGTH).toBe(8);
    });
  });

  describe("DOCUMENT_DEBOUNCE_MS", () => {
    it("is a positive number", () => {
      expect(DOCUMENT_DEBOUNCE_MS).toBeGreaterThan(0);
    });
  });

  describe("ROOM_EXPIRY_DAYS", () => {
    it("is 7 days", () => {
      expect(ROOM_EXPIRY_DAYS).toBe(7);
    });
  });

  describe("DEFAULT_PAGINATION_LIMIT", () => {
    it("is 20", () => {
      expect(DEFAULT_PAGINATION_LIMIT).toBe(20);
    });
  });

  describe("YJS key names", () => {
    it("YJS_TEXT_KEY is a non-empty string", () => {
      expect(YJS_TEXT_KEY).toBeTruthy();
      expect(typeof YJS_TEXT_KEY).toBe("string");
    });

    it("YJS_SETTINGS_KEY is a non-empty string", () => {
      expect(YJS_SETTINGS_KEY).toBeTruthy();
      expect(typeof YJS_SETTINGS_KEY).toBe("string");
    });

    it("text and settings keys are different", () => {
      expect(YJS_TEXT_KEY).not.toBe(YJS_SETTINGS_KEY);
    });
  });
});

describe("types", () => {
  it("EditorLanguage type matches SUPPORTED_LANGUAGES at runtime", () => {
    // This test verifies that the type and constant stay in sync
    // by checking each supported language can be assigned
    const languages: EditorLanguage[] = [...SUPPORTED_LANGUAGES];
    expect(languages).toEqual(SUPPORTED_LANGUAGES);
  });
});
