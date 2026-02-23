import { Hono } from 'hono';
import { RoomStore } from '../persistence/room-store';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, DEFAULT_PAGINATION_LIMIT } from '@code-duo/shared/src/constants';
import type { EditorLanguage } from '@code-duo/shared/src/types';

const roomStore = new RoomStore();
export const apiRouter = new Hono();

/** POST /api/rooms — create a new room */
apiRouter.post('/rooms', async (c) => {
  const body = await c.req.json<{ name?: string; language?: string }>();

  const name = (body.name ?? 'My Room').trim().slice(0, 100);
  const language = SUPPORTED_LANGUAGES.includes(body.language as EditorLanguage)
    ? (body.language as EditorLanguage)
    : DEFAULT_LANGUAGE;

  const room = roomStore.createRoom(name, language);
  return c.json({ ...room, url: `/room/${room.id}` }, 201);
});

/** GET /api/rooms/:id — get room metadata */
apiRouter.get('/rooms/:id', (c) => {
  const room = roomStore.getRoom(c.req.param('id'));
  if (!room) return c.json({ error: 'Room not found' }, 404);
  return c.json(room);
});

/** GET /api/rooms — list rooms with pagination */
apiRouter.get('/rooms', (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_PAGINATION_LIMIT), 100);
  const offset = Number(c.req.query('offset') ?? 0);
  const rooms = roomStore.listRooms(limit, offset);
  return c.json({ data: rooms, limit, offset });
});

/** GET /api/health — health check */
apiRouter.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
  });
});
