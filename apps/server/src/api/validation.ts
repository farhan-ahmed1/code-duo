import { MiddlewareHandler } from "hono";
import {
  SUPPORTED_LANGUAGES,
  MAX_ROOM_NAME_LENGTH,
} from "@code-duo/shared/src/constants";
import type { EditorLanguage } from "@code-duo/shared/src/types";

// ── Constants ──────────────────────────────────────────────────────

/** Allow alphanumeric, spaces, and common punctuation. */
const ROOM_NAME_PATTERN = /^[\w\s\-.,!?'"()&+#@:;/]+$/;

/** Maximum request body size in bytes (64 KB). */
const MAX_BODY_SIZE = 64 * 1024;

// ── Sanitisation ───────────────────────────────────────────────────

/**
 * Strip characters that could be used for XSS in contexts where the
 * value might be reflected (e.g. JSON API responses rendered by a
 * browser). Yjs itself transports binary, but API string fields still
 * go through JSON.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // strip angle brackets
    .replace(/javascript:/gi, "") // strip JS protocol URIs
    .replace(/on\w+\s*=/gi, "") // strip inline event handlers
    .trim();
}

// ── Validators ─────────────────────────────────────────────────────

export interface RoomNameValidation {
  valid: boolean;
  sanitized: string;
  error?: string;
}

export function validateRoomName(name: unknown): RoomNameValidation {
  if (typeof name !== "string" && name !== undefined && name !== null) {
    return { valid: false, sanitized: "", error: "Room name must be a string" };
  }

  const raw = typeof name === "string" ? name : "";
  const sanitized = sanitizeString(raw).slice(0, MAX_ROOM_NAME_LENGTH);

  if (sanitized.length === 0) {
    // Empty is OK — we fall back to "My Room"
    return { valid: true, sanitized: "" };
  }

  if (!ROOM_NAME_PATTERN.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error:
        "Room name may only contain letters, numbers, spaces, and common punctuation (- . , ! ? ' \" ( ) & + # @ : ; /)",
    };
  }

  return { valid: true, sanitized };
}

export interface LanguageValidation {
  valid: boolean;
  language: EditorLanguage | null;
  error?: string;
}

export function validateLanguage(lang: unknown): LanguageValidation {
  if (lang === undefined || lang === null) {
    return { valid: true, language: null }; // will use default
  }

  if (typeof lang !== "string") {
    return {
      valid: false,
      language: null,
      error: "Language must be a string",
    };
  }

  if (!SUPPORTED_LANGUAGES.includes(lang as EditorLanguage)) {
    return {
      valid: false,
      language: null,
      error: `Unsupported language "${lang}". Must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
    };
  }

  return { valid: true, language: lang as EditorLanguage };
}

// ── Middleware ──────────────────────────────────────────────────────

/**
 * Reject request bodies that exceed MAX_BODY_SIZE.
 * Reads Content-Length first (cheap), then falls back to buffering
 * the body if no header is present.
 */
export const bodySizeLimit: MiddlewareHandler = async (c, next) => {
  const contentLength = c.req.header("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return c.json(
      { error: `Request body too large. Maximum size is ${MAX_BODY_SIZE} bytes.` },
      413,
    );
  }
  await next();
};
