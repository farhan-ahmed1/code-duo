import { Hono } from "hono";
import { RoomStore } from "../persistence/room-store";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGINATION_LIMIT,
} from "@code-duo/shared/src/constants";
import { roomCreationRateLimit } from "./rate-limiter";
import {
  validateRoomName,
  validateLanguage,
} from "./validation";

const roomStore = new RoomStore();
export const apiRouter = new Hono();

// Export for use by the cleanup job
export { roomStore };

/** POST /api/rooms — create a new room */
apiRouter.post("/rooms", roomCreationRateLimit, async (c) => {
  let body: { name?: string; language?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate room name
  const nameResult = validateRoomName(body.name);
  if (!nameResult.valid) {
    return c.json({ error: nameResult.error }, 400);
  }
  const name = nameResult.sanitized || "My Room";

  // Validate language
  const langResult = validateLanguage(body.language);
  if (!langResult.valid) {
    return c.json({ error: langResult.error }, 400);
  }
  const language = langResult.language ?? DEFAULT_LANGUAGE;

  const room = roomStore.createRoom(name, language);
  return c.json({ ...room, url: `/room/${room.id}` }, 201);
});

/** GET /api/rooms/:id — get room metadata */
apiRouter.get("/rooms/:id", (c) => {
  const room = roomStore.getRoom(c.req.param("id"));
  if (!room) return c.json({ error: "Room not found" }, 404);
  return c.json(room);
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

/** GET /api/health — health check */
apiRouter.get("/health", (c) => {
  return c.json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
  });
});
