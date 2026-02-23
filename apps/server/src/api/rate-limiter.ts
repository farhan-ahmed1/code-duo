import { MiddlewareHandler } from "hono";
import { logger } from "../utils/logger";

/**
 * Sliding-window counter rate limiter.
 *
 * Tracks request counts in a current and previous window so limits
 * degrade smoothly rather than resetting at hard boundaries.
 *
 * NOTE: This is an in-memory implementation suitable for single-server
 * deployments. For multi-server setups, swap this for a Redis-backed
 * implementation (see ARCHITECTURE.md scaling considerations).
 */
class SlidingWindowRateLimiter {
  /** windowMs → Map<key, count> for the *current* window */
  private currentWindow = new Map<string, number>();
  /** windowMs → Map<key, count> for the *previous* window */
  private previousWindow = new Map<string, number>();
  private currentWindowStart: number;

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {
    this.currentWindowStart = Date.now();
  }

  /**
   * Roll the window forward if necessary and return whether the request
   * should be allowed.
   */
  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const elapsed = now - this.currentWindowStart;

    // If we've moved past the current window, rotate
    if (elapsed >= this.windowMs) {
      // If more than two windows have passed, both are empty
      if (elapsed >= this.windowMs * 2) {
        this.previousWindow = new Map();
      } else {
        this.previousWindow = this.currentWindow;
      }
      this.currentWindow = new Map();
      this.currentWindowStart =
        now - (elapsed % this.windowMs); // align to window boundary
    }

    // Weighted count: previous window's contribution decreases linearly
    const windowProgress =
      (now - this.currentWindowStart) / this.windowMs;
    const prevCount = this.previousWindow.get(key) ?? 0;
    const currCount = this.currentWindow.get(key) ?? 0;
    const estimatedCount =
      prevCount * (1 - windowProgress) + currCount;

    if (estimatedCount >= this.maxRequests) {
      // Estimate when the window will slide enough to allow a new request
      const retryAfterMs = Math.ceil(this.windowMs * (1 - windowProgress));
      return { allowed: false, retryAfterMs };
    }

    // Record the hit
    this.currentWindow.set(key, currCount + 1);
    return { allowed: true, retryAfterMs: 0 };
  }

  /** Periodic cleanup of stale entries to prevent memory leaks. */
  cleanup() {
    this.previousWindow.clear();
  }
}

// ── Limiter instances ──────────────────────────────────────────────

/** Room creation: 10 rooms per IP per hour */
const roomCreationLimiter = new SlidingWindowRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,
);

/** General API requests: 100 requests per IP per minute */
const apiRequestLimiter = new SlidingWindowRateLimiter(
  60 * 1000, // 1 minute
  100,
);

// Clean up stale entries every 10 minutes
setInterval(() => {
  roomCreationLimiter.cleanup();
  apiRequestLimiter.cleanup();
}, 10 * 60 * 1000).unref();

// ── Helper to extract client IP ────────────────────────────────────

function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  // Prefer X-Forwarded-For (when behind a proxy/LB), fall back to
  // the direct connection address.
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

// ── Middleware factories ───────────────────────────────────────────

/**
 * Rate-limit room creation: 10 rooms per IP per hour.
 * Apply to `POST /api/rooms`.
 */
export const roomCreationRateLimit: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c);
  const { allowed, retryAfterMs } = roomCreationLimiter.check(ip);

  if (!allowed) {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    logger.warn({ ip, limit: "room-creation" }, "Rate limit exceeded");
    c.header("Retry-After", String(retryAfterSeconds));
    return c.json(
      {
        error: "Too many rooms created. Please try again later.",
        retryAfter: retryAfterSeconds,
      },
      429,
    );
  }

  await next();
};

/**
 * Rate-limit general API traffic: 100 requests per IP per minute.
 * Apply globally to `/api/*`.
 */
export const apiRateLimit: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c);
  const { allowed, retryAfterMs } = apiRequestLimiter.check(ip);

  if (!allowed) {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    logger.warn({ ip, limit: "api-general" }, "Rate limit exceeded");
    c.header("Retry-After", String(retryAfterSeconds));
    return c.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: retryAfterSeconds,
      },
      429,
    );
  }

  await next();
};
