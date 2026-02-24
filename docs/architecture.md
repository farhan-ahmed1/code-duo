# Architecture

## Overview

Code Duo is a real-time collaborative code editor built on **Yjs** CRDTs, a **Hono** HTTP API, WebSocket relay, and a **Next.js** frontend with Monaco Editor.

```bash
┌──────────────┐   HTTP / WS   ┌─────────────────────────┐
│  Next.js Web │ ◄───────────► │  Hono + WS Server       │
│  (React 18)  │               │  (Node.js)              │
└──────────────┘               │                         │
                               │  ┌─ API routes          │
                               │  ├─ Rate limiter        │
                               │  ├─ Input validation    │
                               │  ├─ y-websocket relay   │
                               │  └─ Room cleanup job    │
                               │                         │
                               │  SQLite (better-sqlite3)│
                               └─────────────────────────┘
```

## Request Flow

1. Client creates a room via `POST /api/rooms` (rate-limited, input-validated)
2. Client opens a WebSocket to `/yjs/<roomId>`
3. `y-websocket` syncs the Yjs document across all connected clients
4. On first connection to a room, persisted state is loaded from SQLite
5. On last disconnect, state is flushed; incremental saves occur during editing

## Rate Limiting

All API endpoints are protected by an in-memory **sliding-window counter** rate limiter:

| Scope           | Limit                  | Window  |
|-----------------|------------------------|---------|
| Room creation   | 10 rooms per IP        | 1 hour  |
| General API     | 100 requests per IP    | 1 minute|

When a limit is exceeded the server responds with **429 Too Many Requests** and a `Retry-After` header indicating when the client may retry.

### Scaling Consideration

The current rate limiter is **in-memory** and works for single-server deployments. For horizontal scaling behind a load balancer, each server instance tracks its own counters independently — an IP could exceed the intended limit across the cluster.

**Recommended upgrade path:** Replace the in-memory sliding-window with a **Redis-backed** rate limiter (e.g. `@hono-rate-limiter/redis` or a custom Redis `INCR`/`EXPIRE` implementation). Redis provides a single shared counter per key, making limits accurate regardless of the number of server instances.

## Input Validation

All API inputs are validated before processing:

- **Room name:** max 100 characters, alphanumeric + spaces + common punctuation (`- . , ! ? ' " ( ) & + # @ : ; /`). Angle brackets and JS protocol URIs are stripped.
- **Language:** must be one of the `SUPPORTED_LANGUAGES` enum values.
- **Body size:** requests larger than 64 KB are rejected with 413.

Invalid requests receive 400 responses with descriptive error messages.

## Room Expiration

A background cleanup job prevents unbounded database growth:

- Runs **once on server startup** and then **every hour**
- Deletes rooms (and their persisted Yjs documents) not accessed in **7 days** (`ROOM_EXPIRY_DAYS`)
- The `accessed_at` column is updated on every WebSocket connection to a room

## Error Handling

### Backend

- Hono `onError` handler catches unhandled exceptions and returns 500
- Structured JSON error responses for all 4xx/5xx codes
- Pino-based structured logging with request context

### Frontend

- React **Error Boundary** wraps the editor page
- Categorises errors: WebSocket failures, Monaco loading issues, invalid rooms, unknown
- Displays user-friendly messages with **retry** and **go home** actions
- Logs structured error context to the browser console for debugging

## Persistence

- **Rooms & metadata:** SQLite via `better-sqlite3` (WAL mode)
- **Yjs documents:** SQLite BLOB column; loaded on room open, flushed on last disconnect
- **Client-side:** `y-indexeddb` for offline support and instant reload

## Performance Benchmarks

Benchmarks are captured by `apps/web/e2e/performance-benchmark.spec.ts` and can
be reproduced by running:

```bash
pnpm test:e2e:benchmark
```

Results are written to `apps/web/e2e/benchmark-results.json` after each run.

### Edit Propagation Latency (localhost, same region)

Time from a keystroke on Client A until the change is visible on Client B.
Measured with varying numbers of idle users in the same room (server fan-out
load) across 7 samples per concurrency level.

| Concurrent Users | min (ms) | p50 (ms) | p95 (ms) | max (ms) |
|------------------|----------|----------|----------|----------|
| 1                | 98       | 134      | 297      | 297      |
| 3                | 161      | 231      | 342      | 342      |
| 5                | 271      | 337      | 448      | 448      |
| 10               | 669      | 726      | 1153     | 1153     |

_Re-run `pnpm test:e2e:benchmark` to refresh. Results are also written to `apps/web/e2e/benchmark-results.json`._

**Target:** p95 < 50 ms (same region, production); p95 < 5 000 ms (localhost ceiling enforced by test).

### Document Load Time

Time from `page.goto(roomUrl)` until Monaco is interactive, with documents of
various sizes pre-seeded in SQLite (4 samples per size, fresh browser context
each time — no warm cache).

| Document Size | min (ms) | p50 (ms) | p95 (ms) | max (ms) |
|---------------|----------|----------|----------|----------|
| 1 KB          | 1191     | 1209     | 1611     | 1611     |
| 100 KB        | 1040     | 1134     | 1149     | 1149     |
| 1 MB          | 1055     | 1085     | 1205     | 1205     |

_Re-run `pnpm test:e2e:benchmark` to refresh. Results are also written to `apps/web/e2e/benchmark-results.json`._

**Target:** 1 MB document loads in under 15 seconds (ceiling enforced by test).

### Methodology

- All measurements taken on **localhost** (same machine as the server).
- Edit propagation latency is measured as wall-clock time: `typeMarker` call
  fires, then we poll the receiver page until the marker string appears.
- Document load time starts at `page.goto` and ends when
  `.monaco-editor .view-lines` is visible in the DOM.
- Percentiles: p50 = median, p95 = 95th percentile of the sample array.

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | Next.js, React 18, Monaco     |
| Realtime   | Yjs, y-websocket, WebSocket   |
| API        | Hono                          |
| Database   | SQLite (better-sqlite3)       |
| Monitoring | Prometheus (prom-client)      |
| Logging    | Pino                          |
