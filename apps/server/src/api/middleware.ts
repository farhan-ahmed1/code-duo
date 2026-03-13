import { MiddlewareHandler, ErrorHandler } from "hono";
import { cors } from "hono/cors";
import { logger } from "../utils/logger";
import { httpRequestDuration } from "../utils/metrics";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

export const corsMiddleware = cors({
  origin: (origin) =>
    !origin || ALLOWED_ORIGINS.includes(origin) ? origin || ALLOWED_ORIGINS[0] : "",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
});

/**
 * Combined request logger and Prometheus histogram tracker.
 *
 * Logs every HTTP request as structured JSON with method, path, status,
 * and duration.  Simultaneously records the duration in the
 * `codeduo_http_request_duration_seconds` histogram so Prometheus can
 * scrape latency percentiles.
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const durationMs = performance.now() - start;
  const durationSec = durationMs / 1000;

  // Normalise route for histogram label (avoid high-cardinality param explosion)
  const route = c.req.routePath || c.req.path;

  logger.info({
    method: c.req.method,
    path: c.req.path,
    route,
    status: c.res.status,
    duration: Math.round(durationMs),
    event: "http_request",
  });

  httpRequestDuration.observe(
    { method: c.req.method, route, status: String(c.res.status) },
    durationSec,
  );
};

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error(
    { err, path: c.req.path, method: c.req.method, event: "unhandled_error" },
    "Unhandled error",
  );
  return c.json({ error: "Internal server error" }, 500);
};
