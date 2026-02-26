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
  "updatedAt": "2026-02-26T10:00:00.000Z"
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

The y-websocket provider handles reconnection automatically with exponential backoff. Code Duo configures it as follows:

```typescript
const WS_RECONNECT_CONFIG = {
  maxBackoffTime: 2500, // ms — maximum delay between retries
  initialReconnectDelay: 100, // ms — first retry delay
  maxReconnectDelay: 30_000, // ms — hard ceiling on retry delay
  bcChannelName: "code-duo", // BroadcastChannel name for cross-tab sync
};
```

The `WebsocketProvider` also uses a **BroadcastChannel** to exchange updates between multiple tabs open on the same origin, so two tabs in the same browser share document state immediately without round-tripping to the server.

### Persistence Lifecycle

When clients connect to a room:

1. The first connection triggers `bindState`: the server loads the persisted Yjs state from SQLite and applies it to the server-side `Y.Doc`.
2. As edits flow in, the server debounces document saves (every 2 seconds).
3. When the last client disconnects, `writeState` fires immediately and saves the final document state to SQLite.

Clients with `y-indexeddb` installed (all Code Duo frontend clients) also persist every update locally. On reconnect, both the IndexedDB state and the server state are merged automatically.

---

## Error Responses

All error responses use the following JSON structure:

```json
{ "error": "Human-readable error message" }
```

| Status                      | When                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | Invalid JSON body, invalid `name` (unsupported characters, too long), invalid `language` (not in the supported list) |
| `404 Not Found`             | Room ID does not exist (`GET /api/rooms/:id`)                                                                        |
| `413 Content Too Large`     | Request body exceeds 64 KB                                                                                           |
| `429 Too Many Requests`     | Rate limit exceeded. Includes a `Retry-After` header with the number of seconds to wait.                             |
| `500 Internal Server Error` | Unhandled server exception                                                                                           |
| `503 Service Unavailable`   | Server not yet ready (`GET /api/health/ready` only)                                                                  |

**Example 400:**

```bash
curl -X POST http://localhost:4000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>", "language": "typescript"}'
```

```json
{
  "error": "Room name may only contain letters, numbers, spaces, and common punctuation (- . , ! ? ' \" ( ) & + # @ : ; /)"
}
```

**Example 429:**

```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{ "error": "Too many requests" }
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

---

## CORS

The server accepts cross-origin requests from origins listed in the `ALLOWED_ORIGIN` environment variable (comma-separated). In development this defaults to `http://localhost:3000`.

Allowed methods: `GET POST PUT DELETE OPTIONS`
Allowed headers: `Content-Type Authorization`
