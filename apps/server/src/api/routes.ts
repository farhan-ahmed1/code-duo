import { Hono } from "hono";
import { RoomStore } from "../persistence/room-store";
import { DEFAULT_LANGUAGE, DEFAULT_PAGINATION_LIMIT } from "@code-duo/shared";
import { roomCreationRateLimit } from "./rate-limiter";
import { validateRoomName, validateLanguage } from "./validation";
import { ERROR_CODES, apiError } from "./errors";
import { logger } from "../utils/logger";
import {
  metricsRegistry,
  activeConnections,
  activeRooms,
} from "../utils/metrics";
import {
  getRoomConnectionCount,
  getRealtimeStats,
} from "../utils/realtime-stats";

const roomStore = new RoomStore();
export const apiRouter = new Hono();

// Export for use by the cleanup job
export { roomStore };

// ── Readiness gate ─────────────────────────────────────────────────
// Flipped to true once the server has fully initialised (called from index.ts).
let serverReady = false;
export function markServerReady() {
  serverReady = true;
}

/** POST /api/rooms — create a new room */
apiRouter.post("/rooms", roomCreationRateLimit, async (c) => {
  let body: { name?: string; language?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      apiError("Invalid JSON body", ERROR_CODES.INVALID_JSON_BODY),
      400,
    );
  }

  // Validate room name
  const nameResult = validateRoomName(body.name);
  if (!nameResult.valid) {
    return c.json(apiError(nameResult.error!, nameResult.code!), 400);
  }
  const name = nameResult.sanitized || "My Room";

  // Validate language
  const langResult = validateLanguage(body.language);
  if (!langResult.valid) {
    return c.json(apiError(langResult.error!, langResult.code!), 400);
  }
  const language = langResult.language ?? DEFAULT_LANGUAGE;

  const room = roomStore.createRoom(name, language);

  logger.info(
    { roomId: room.id, name, language, event: "room_created" },
    "Room created via API",
  );

  return c.json({ ...room, url: `/room/${room.id}` }, 201);
});

/** GET /api/rooms/:id — get room metadata */
apiRouter.get("/rooms/:id", (c) => {
  const room = roomStore.getRoom(c.req.param("id"));
  if (!room) {
    return c.json(apiError("Room not found", ERROR_CODES.ROOM_NOT_FOUND), 404);
  }
  return c.json({
    ...room,
    activeUserCount: getRoomConnectionCount(room.id),
  });
});

/** GET /api/rooms — list rooms with pagination */
apiRouter.get("/rooms", (c) => {
  const limit = Math.min(
    Number(c.req.query("limit") ?? DEFAULT_PAGINATION_LIMIT),
    100,
  );
  const offset = Number(c.req.query("offset") ?? 0);
  const rooms = roomStore.listRooms(limit, offset);
  return c.json({ data: rooms, limit, offset });
});

// ── Observability endpoints ────────────────────────────────────────

/**
 * GET /api/health — comprehensive health check.
 *
 * Returns database connectivity, active rooms/connections, memory
 * usage, and uptime.
 */
apiRouter.get("/health", (c) => {
  let dbHealthy = true;
  try {
    // Quick connectivity probe — a lightweight read that exercises the
    // SQLite connection without returning meaningful data.
    roomStore.listRooms(1, 0);
  } catch {
    dbHealthy = false;
  }

  const mem = process.memoryUsage();

  return c.json({
    status: dbHealthy ? "healthy" : "degraded",
    uptime: Math.floor(process.uptime()),
    database: dbHealthy ? "connected" : "unreachable",
    connections: {
      active: getGaugeValue(activeConnections),
      rooms: getGaugeValue(activeRooms),
    },
    realtime: getRealtimeStats(),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
  });
});

/**
 * GET /api/health/ready — readiness probe.
 *
 * Returns 200 only when the server is fully initialised (WebSocket
 * server attached, cleanup job started, metrics collector running).
 * Useful for container orchestrators (k8s readinessProbe, Docker
 * HEALTHCHECK, etc.).
 */
apiRouter.get("/health/ready", (c) => {
  if (!serverReady) {
    return c.json(
      {
        ...apiError("Server is not ready", ERROR_CODES.SERVER_NOT_READY),
        ready: false,
      },
      503,
    );
  }
  return c.json({ ready: true, uptime: Math.floor(process.uptime()) });
});

/**
 * GET /metrics — Prometheus scrape endpoint.
 *
 * Returns all registered metrics in the Prometheus exposition format.
 * This endpoint is intentionally outside the `/api` prefix so the
 * rate-limiter and body-size middleware do not interfere with scraping.
 */
apiRouter.get("/metrics", async (c) => {
  const metrics = await metricsRegistry.metrics();
  return c.text(metrics, 200, {
    "Content-Type": metricsRegistry.contentType,
  });
});

// ── Helpers ────────────────────────────────────────────────────────

/** Safely read the current value from a prom-client Gauge. */
function getGaugeValue(gauge: import("prom-client").Gauge): number {
  try {
    // prom-client exposes an internal hashMap; fall back to 0 if
    // the private API changes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = gauge as any;
    return Number(internal.hashMap?.[""]?.value ?? 0);
  } catch {
    return 0;
  }
}
