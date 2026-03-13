# API Reference

Code Duo exposes a REST API for room management and observability, and a WebSocket interface for real-time document synchronisation. This document covers both.

**Base URL (local dev):** `http://localhost:4000`

---

## REST Endpoints

### POST /api/rooms

Create a new collaboration room.

**Rate limit:** 10 rooms per IP per hour.

**Request body:**

```json
{
  "name": "My Room",
  "language": "typescript"
}
```

| Field      | Type   | Required | Description                                                                                                                                                         |
| ---------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | string | No       | Human-readable room name. Max 100 characters, alphanumeric + spaces + punctuation (`- . , ! ? ' " ( ) & + # @ : ; /`). Defaults to `"My Room"` if omitted or empty. |
| `language` | string | No       | Initial editor language. Must be one of the [supported languages](#supported-languages). Defaults to `"typescript"`.                                                |

**Response `201 Created`:**

```json
{
  "id": "xK9mPqRt",
  "name": "My Room",
  "language": "typescript",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:00.000Z",
  "url": "/room/xK9mPqRt"
}
```

**Example:**

```bash
curl -X POST http://localhost:4000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "Pair Programming Session", "language": "python"}'
```

---

### GET /api/rooms/:id

Retrieve metadata for a single room.

**Path parameter:** `id` — the room ID returned by `POST /api/rooms`.

**Response `200 OK`:**

```json
{
  "id": "xK9mPqRt",
  "name": "Pair Programming Session",
  "language": "python",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:00.000Z",
  "activeUserCount": 2
}
```

**Example:**

```bash
curl http://localhost:4000/api/rooms/xK9mPqRt
```

---

### GET /api/rooms

List rooms, ordered by creation date (newest first).

**Query parameters:**

| Parameter | Type   | Default | Description                               |
| --------- | ------ | ------- | ----------------------------------------- |
| `limit`   | number | 20      | Maximum rooms to return. Capped at 100.   |
| `offset`  | number | 0       | Number of rooms to skip (for pagination). |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "xK9mPqRt",
      "name": "Pair Programming Session",
      "language": "python",
      "createdAt": "2026-02-26T10:00:00.000Z",
      "updatedAt": "2026-02-26T10:00:00.000Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

**Example:**

```bash
# First page
curl "http://localhost:4000/api/rooms?limit=20&offset=0"

# Second page
curl "http://localhost:4000/api/rooms?limit=20&offset=20"
```

---

### GET /api/health

Comprehensive health check. Returns database connectivity status, active connection counts, memory usage, and uptime.

**Response `200 OK` (healthy):**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected",
  "connections": {
    "active": 12,
    "rooms": 4
  },
  "realtime": {
    "activeConnections": 12,
    "activeRooms": 4
  },
  "memory": {
    "rss": 52428800,
    "heapUsed": 24117248,
    "heapTotal": 37748736,
    "external": 1048576
  }
}
```

**Response `200 OK` (degraded — database unreachable):**

```json
{
  "status": "degraded",
  "uptime": 10,
  "database": "unreachable",
  ...
}
```

The endpoint always returns `200`. Check the `status` field to distinguish healthy from degraded states.

**Example:**

```bash
curl http://localhost:4000/api/health
```

---

### GET /api/health/ready

Readiness probe. Returns `200` only when the server has fully initialised — WebSocket server attached, cleanup job started, metrics collector running.

Use this as your container readiness probe (Kubernetes `readinessProbe`, Docker `HEALTHCHECK`, Railway health check path, etc.).

**Response `200 OK` (ready):**

```json
{ "ready": true, "uptime": 5 }
```

**Response `503 Service Unavailable` (not yet ready):**

```json
{ "ready": false }
```

**Example:**

```bash
curl http://localhost:4000/api/health/ready
```

---

### GET /metrics

Prometheus metrics in the [exposition text format](https://prometheus.io/docs/instrumenting/exposition_formats/).

This endpoint is intentionally outside the `/api` prefix so the rate limiter does not interfere with Prometheus scraping.

**Response `200 OK`:** Plain text in Prometheus exposition format.

**Exposed metrics:**

| Metric                                  | Type      | Description                                                   |
| --------------------------------------- | --------- | ------------------------------------------------------------- |
| `codeduo_active_connections`            | Gauge     | Current number of open WebSocket connections                  |
| `codeduo_active_rooms`                  | Gauge     | Rooms with at least one connected user                        |
| `codeduo_messages_total`                | Counter   | Total WebSocket messages received                             |
| `codeduo_document_saves_total`          | Counter   | Total document persistence writes to SQLite                   |
| `codeduo_http_request_duration_seconds` | Histogram | HTTP request latency, labelled by `method`, `route`, `status` |

Standard Node.js process metrics (`process_cpu_seconds_total`, `nodejs_heap_size_bytes`, etc.) are also included via `collectDefaultMetrics`.

**Example:**

```bash
curl http://localhost:4000/metrics
```

**Example output (excerpt):**

```bash
# HELP codeduo_active_connections Number of active WebSocket connections
# TYPE codeduo_active_connections gauge
codeduo_active_connections 12

# HELP codeduo_messages_total Total WebSocket messages relayed
# TYPE codeduo_messages_total counter
codeduo_messages_total 4891

# HELP codeduo_http_request_duration_seconds HTTP request duration in seconds
# TYPE codeduo_http_request_duration_seconds histogram
codeduo_http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/health",status="200"} 14
codeduo_http_request_duration_seconds_bucket{le="0.01",method="GET",route="/api/health",status="200"} 14
```

---

## WebSocket Interface

The WebSocket interface is used exclusively by the Yjs `y-websocket` provider. It is not a general-purpose JSON API — the binary messages it exchanges are internal to the y-websocket protocol and are not intended to be constructed by hand.

### Connecting

```bash
ws://localhost:4000/yjs/:roomId
```

Replace `:roomId` with the ID returned by `POST /api/rooms` (e.g. `xK9mPqRt`).

Only paths starting with `/yjs/` are accepted by the WebSocket server. Any other upgrade request is rejected.

**Example (using the y-websocket provider in the frontend):**

```typescript
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  "ws://localhost:4000", // server URL
  "xK9mPqRt", // room ID (used as the document name)
  ydoc,
  {
    connect: true,
    maxBackoffTime: 2500,
  },
);
```

### Protocol

The y-websocket protocol uses a binary message format encoded with the [lib0 encoding library](https://github.com/dmonad/lib0). There are three message types:

| Type                        | Direction       | Description                                                                                   |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `messageSync` (0)           | Both            | Initial document sync — clients exchange state vectors, then the server sends missing updates |
| `messageAwareness` (1)      | Both            | Ephemeral awareness state (cursor positions, user info)                                       |
| `messageQueryAwareness` (3) | Client → Server | Request the current awareness states of all connected clients                                 |

The sync flow on connection:

1. Client sends a **sync step 1** message containing its state vector (a summary of all operations it has seen).
2. Server responds with a **sync step 2** message containing all updates the client hasn't seen yet, plus the server's own state vector.
3. Client applies the updates and fires its `sync` event.
4. Both sides then stream incremental updates as edits are made.

### Reconnection

The y-websocket provider reconnects automatically. Code Duo currently passes these runtime options to the provider:

```typescript
const provider = new WebsocketProvider("ws://localhost:4000/yjs", roomId, ydoc, {
  connect: true,
  maxBackoffTime: 2500,
  resyncInterval: 5000,
});
```

Operationally, that means:

1. The client begins reconnect attempts automatically after a disconnect.
2. Retry delays use y-websocket's built-in exponential backoff, capped at `2500 ms` between attempts.
3. Once reconnected, the provider resynchronises state and also performs a periodic full resync every `5 seconds` while connected.
4. While disconnected, the editor remains usable because updates are buffered locally in the Yjs document and persisted in IndexedDB.
5. When the socket reconnects, local changes, IndexedDB state, and the server snapshot are merged by Yjs.

The provider also uses browser-local cross-tab coordination, so multiple tabs on the same origin can exchange updates without waiting for a server round trip.

### Persistence Lifecycle

When clients connect to a room:

1. The first connection triggers `bindState`: the server loads the persisted Yjs state from SQLite and applies it to the server-side `Y.Doc`.
2. As edits flow in, the server debounces document saves (every 2 seconds).
3. When the last client disconnects, `writeState` fires immediately and saves the final document state to SQLite.

Clients with `y-indexeddb` installed (all Code Duo frontend clients) also persist every update locally. On reconnect, both the IndexedDB state and the server state are merged automatically.

### Critical Integration Example: Hono + y-websocket Upgrade

```ts
import { getRequestListener } from "@hono/node-server";
import { createServer } from "node:http";
import { Hono } from "hono";
import { WebSocketServer } from "ws";
import { setupWebSocketServer } from "./ws-server";

const app = new Hono();
const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

setupWebSocketServer(wss);

httpServer.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/yjs/")) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

httpServer.on("request", getRequestListener(app.fetch));
```

### Critical Integration Example: Persistence Hooks

```ts
import * as Y from "yjs";
import { setPersistence } from "y-websocket/bin/utils";

setPersistence({
  bindState: async (roomId, ydoc) => {
    const persisted = documentStore.loadDocument(roomId);
    if (persisted) {
      Y.applyUpdate(ydoc, persisted);
    }

    ydoc.on("update", () => scheduleSave(roomId, ydoc));
  },
  writeState: async (roomId, ydoc) => {
    const state = Y.encodeStateAsUpdate(ydoc);
    documentStore.saveDocument(roomId, state);
  },
});
```

## Database Schema

```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accessed_at TEXT NOT NULL
);

CREATE TABLE documents (
  room_id TEXT PRIMARY KEY,
  state BLOB NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

Room expiration uses a 7-day TTL implemented by the hourly cleanup job. Any room whose `accessed_at` is older than 7 days is deleted, and its persisted Yjs snapshot is removed from `documents` before the room row is purged.

## Security Controls

- Input validation: room names must be strings no longer than 100 characters and may only contain the approved punctuation set; languages must be in the shared supported language enum.
- Rate limiting: `POST /api/rooms` is limited to 10 room creations per IP per hour, and all `/api/*` routes are limited to 100 requests per IP per minute.
- CORS: only configured frontend origins are allowed through `ALLOWED_ORIGIN`.
- Request body limits: non-GET API requests larger than 64 KB are rejected with `413` even when `Content-Length` is absent.

## OpenAPI-Style Summary

```yaml
openapi: 3.1.0
info:
  title: Code Duo API
  version: 1.0.0
paths:
  /api/rooms:
    post:
      summary: Create a room
      responses:
        '201':
          description: Room created
    get:
      summary: List rooms
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
        - in: query
          name: offset
          schema:
            type: integer
      responses:
        '200':
          description: Paginated room list
  /api/rooms/{id}:
    get:
      summary: Get room metadata and active users
      responses:
        '200':
          description: Room metadata returned
        '404':
          description: Room not found
  /api/health:
    get:
      summary: Liveness and dependency health
  /api/health/ready:
    get:
      summary: Readiness probe
  /metrics:
    get:
      summary: Prometheus metrics scrape endpoint
```

---

## Error Responses

All JSON error responses now use the following structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE"
}
```

Rate-limited responses also include `retryAfter` in the body and `Retry-After` in the response headers.

### Error Code Catalog

| HTTP Status | Error Code                     | Endpoint / Layer                | Meaning |
| ----------- | ------------------------------ | ------------------------------- | ------- |
| `400`       | `INVALID_JSON_BODY`            | `POST /api/rooms`               | The request body was not valid JSON. |
| `400`       | `ROOM_NAME_INVALID_TYPE`       | `POST /api/rooms`               | `name` was present but not a string. |
| `400`       | `ROOM_NAME_TOO_LONG`           | `POST /api/rooms`               | `name` exceeded 100 characters after sanitisation. |
| `400`       | `ROOM_NAME_INVALID_CHARACTERS` | `POST /api/rooms`               | `name` contained characters outside the allowed punctuation set. |
| `400`       | `LANGUAGE_INVALID_TYPE`        | `POST /api/rooms`               | `language` was present but not a string. |
| `400`       | `LANGUAGE_UNSUPPORTED`         | `POST /api/rooms`               | `language` was not one of the supported Monaco language IDs. |
| `404`       | `ROOM_NOT_FOUND`               | `GET /api/rooms/:id`            | The requested room row does not exist in SQLite. |
| `413`       | `REQUEST_BODY_TOO_LARGE`       | `/api/*` middleware             | The request body exceeded `65536` bytes. |
| `429`       | `RATE_LIMIT_API`               | Global `/api/*` limiter         | The caller exceeded the general API budget of 100 requests per IP per minute. |
| `429`       | `RATE_LIMIT_ROOM_CREATION`     | `POST /api/rooms` route limiter | The caller exceeded the room-creation budget of 10 room creations per IP per hour. |
| `500`       | `INTERNAL_SERVER_ERROR`        | Global error handler            | An unhandled server exception escaped the route or middleware stack. |
| `503`       | `SERVER_NOT_READY`             | `GET /api/health/ready`         | The process has started but has not yet finished full initialisation. |

### Failure-Path Semantics

| Status                  | When |
| ----------------------- | ---- |
| `400 Bad Request`       | Validation or parsing failed for the request body. |
| `404 Not Found`         | The room lookup endpoint was called with an unknown room ID. |
| `413 Content Too Large` | Body-size middleware rejected the request before route handling. |
| `429 Too Many Requests` | Either the global API limiter or the room-creation limiter rejected the request. Inspect `code` to tell which one fired. |
| `500 Internal Server Error` | An unexpected exception occurred and was normalized by the Hono error handler. |
| `503 Service Unavailable` | The readiness probe was called before server startup completed. |

**Example 400:**

```bash
curl -X POST http://localhost:4000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>", "language": "typescript"}'
```

```json
{
  "error": "Room name may only contain letters, numbers, spaces, and common punctuation (- . , ! ? ' \" ( ) & + # @ : ; /)",
  "code": "ROOM_NAME_INVALID_CHARACTERS"
}
```

**Example 429:**

```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_API",
  "retryAfter": 42
}
```

**Example 503:**

```json
{
  "error": "Server is not ready",
  "code": "SERVER_NOT_READY",
  "ready": false
}
```

---

## Supported Languages

The `language` field on rooms must be one of:

```bash
typescript  javascript  python  go  rust
c           cpp         java    csharp  ruby
php         html        css     json    markdown
```

These correspond directly to Monaco Editor language IDs.

---

## Rate Limits Summary

| Endpoint                     | Limit               | Window   |
| ---------------------------- | ------------------- | -------- |
| `POST /api/rooms`            | 10 requests per IP  | 1 hour   |
| All other `/api/*` endpoints | 100 requests per IP | 1 minute |

Rate limiting uses an in-memory sliding-window counter. See [ARCHITECTURE.md](architecture.md#scaling-considerations) for details on the behaviour under horizontal scaling and the recommended Redis upgrade path.

### Operator Notes

1. `POST /api/rooms` passes through two independent limiters: the global API limiter first, then the route-specific room-creation limiter.
2. A burst of general traffic can therefore return `RATE_LIMIT_API` before the request reaches the room-creation limiter.
3. When a limiter fires, the response includes both a `Retry-After` header and a numeric `retryAfter` body field in seconds.
4. `/metrics` is intentionally excluded from `/api/*` so Prometheus scraping is never throttled by the API limiter.
5. Rate-limit state is process-local. In a horizontally scaled deployment, each instance tracks its own counters until the limiter is replaced with a shared backend such as Redis.

## WebSocket Operator Semantics

### Upgrade Handling

1. The HTTP server only upgrades requests whose path starts with `/yjs/`.
2. Any other attempted WebSocket upgrade is rejected by destroying the socket; there is no JSON error body for invalid upgrade paths.
3. The server does not expose a separate rate limiter for WebSocket upgrades.

### Room Resolution

1. The WebSocket server derives the room ID from the last path segment in `/yjs/:roomId`.
2. WebSocket connectivity itself does not validate the room via a REST lookup first.
3. Code Duo's frontend validates room existence with `GET /api/rooms/:id` before navigating, which is the supported operator-facing flow.

### Disconnect And Recovery Semantics

1. On every successful connection, the server updates the room's `accessed_at` timestamp so active rooms are not purged by the seven-day cleanup job.
2. The first active connection to a room restores the last persisted Yjs snapshot from SQLite.
3. Incremental edits are debounced and flushed to SQLite every `2000 ms`.
4. When the last client disconnects, the server immediately writes the final document state to SQLite.
5. Client-visible connection states are `connecting`, `connected`, and `disconnected`; sync state is tracked separately as `syncing` or `synced`.

---

## CORS

The server accepts cross-origin requests from origins listed in the `ALLOWED_ORIGIN` environment variable (comma-separated). In development this defaults to `http://localhost:3000`.

Allowed methods: `GET POST PUT DELETE OPTIONS`
Allowed headers: `Content-Type Authorization`
