import { MiddlewareHandler } from "hono";
import { SUPPORTED_LANGUAGES, MAX_ROOM_NAME_LENGTH } from "@code-duo/shared";
import type { EditorLanguage } from "@code-duo/shared";
import { ERROR_CODES, apiError, type ApiErrorCode } from "./errors";

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
  code?: ApiErrorCode;
}

export function validateRoomName(name: unknown): RoomNameValidation {
  if (typeof name !== "string" && name !== undefined && name !== null) {
    return {
      valid: false,
      sanitized: "",
      error: "Room name must be a string",
      code: ERROR_CODES.ROOM_NAME_INVALID_TYPE,
    };
  }

  const raw = typeof name === "string" ? name : "";
  const sanitized = sanitizeString(raw);

  if (sanitized.length > MAX_ROOM_NAME_LENGTH) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_ROOM_NAME_LENGTH),
      error: `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or fewer`,
      code: ERROR_CODES.ROOM_NAME_TOO_LONG,
    };
  }

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
      code: ERROR_CODES.ROOM_NAME_INVALID_CHARACTERS,
    };
  }

  return { valid: true, sanitized };
}

export interface LanguageValidation {
  valid: boolean;
  language: EditorLanguage | null;
  error?: string;
  code?: ApiErrorCode;
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
      code: ERROR_CODES.LANGUAGE_INVALID_TYPE,
    };
  }

  if (!SUPPORTED_LANGUAGES.includes(lang as EditorLanguage)) {
    return {
      valid: false,
      language: null,
      error: `Unsupported language "${lang}". Must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
      code: ERROR_CODES.LANGUAGE_UNSUPPORTED,
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
  if (["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    return next();
  }

  const contentLength = c.req.header("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
    return c.json(
      apiError(
        `Request body too large. Maximum size is ${MAX_BODY_SIZE} bytes.`,
        ERROR_CODES.REQUEST_BODY_TOO_LARGE,
      ),
      413,
    );
  }

  if (!contentLength) {
    const clonedRequest = c.req.raw.clone();
    const buffer = await clonedRequest.arrayBuffer();
    if (buffer.byteLength > MAX_BODY_SIZE) {
      return c.json(
        apiError(
          `Request body too large. Maximum size is ${MAX_BODY_SIZE} bytes.`,
          ERROR_CODES.REQUEST_BODY_TOO_LARGE,
        ),
        413,
      );
    }
  }

  await next();
};
