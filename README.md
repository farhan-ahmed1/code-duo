# Code Duo

Real-time collaborative code editor powered by **CRDTs (Yjs)** and **Monaco Editor** — the same engine that drives VS Code.

Multiple users can edit the same document simultaneously with zero merge conflicts, see each other's live cursors, and keep their edits even while offline. Changes sync automatically on reconnect.

---

## Features

- **Real-time collaboration** — edits from any user appear on all other connected clients in ≤50ms (localhost)
- **Live cursors & presence** — see each cursor with a unique colour and display name
- **Zero merge conflicts** — CRDTs (Conflict-Free Replicated Data Types) guarantee convergence regardless of ordering
- **Offline-first** — `y-indexeddb` caches documents locally; edits made offline sync automatically on reconnect
- **Document persistence** — Yjs state is stored in SQLite and survives server restarts
- **15+ language modes** — TypeScript, JavaScript, Python, Go, Rust, Java, C#, and more via Monaco's built-in support
- **Shareable room URLs** — create a room, share the link, start coding together immediately

---

## Tech Stack

| Layer     | Technology                                                   |
| --------- | ------------------------------------------------------------ |
| Frontend  | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Editor    | Monaco Editor (`@monaco-editor/react`), `y-monaco` binding   |
| CRDT sync | Yjs, `y-websocket`, `y-indexeddb`, `y-protocols/awareness`   |
| Backend   | Node.js, Hono (REST API), `y-websocket` server               |
| Database  | SQLite via `better-sqlite3`                                  |
| Monorepo  | pnpm workspaces + Turborepo                                  |
| Testing   | Vitest (unit), Playwright (E2E)                              |

---

## Prerequisites

- **Node.js 20+** — check with `node --version`
- **pnpm 9+** — install with `npm install -g pnpm` then verify with `pnpm --version`

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/code-duo.git
cd code-duo

# 2. Install all workspace dependencies (server + web + shared)
pnpm install
```

---

## Running in Development

```bash
# Start both the backend (port 4000) and frontend (port 3000) in parallel
pnpm dev
```

This command uses Turborepo to run `pnpm dev` in both `apps/server` and `apps/web` concurrently.

| Service            | URL                                                                  |
| ------------------ | -------------------------------------------------------------------- |
| Frontend           | [http://localhost:3000](http://localhost:3000)                       |
| Backend REST API   | [http://localhost:4000/api](http://localhost:4000)                   |
| WebSocket endpoint | ws://localhost:4000/yjs/:roomId                                      |
| Health check       | [http://localhost:4000/api/health](http://localhost:4000/api/health) |
| Prometheus metrics | [http://localhost:4000/metrics](http://localhost:4000/metrics)       |

---

## Verifying It Works (Two-Tab Test)

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click **Create Room**, give it a name and language, then click **Create**
3. Copy the room URL from the address bar (e.g. `http://localhost:3000/room/abc12345`)
4. Open that URL in a **second browser tab** (or a different browser window)
5. Type in one tab — text should appear in the other tab within milliseconds
6. Move your cursor — you should see a coloured cursor indicator in the other tab

### Verifying Persistence

1. Type some content in a room
2. Stop the server (`Ctrl+C`)
3. Restart it (`pnpm dev`)
4. Reload the room URL — your content should still be there

---

## Running Tests

```bash
# Unit tests (Vitest) — covers persistence stores and CRDT behaviour
pnpm test:unit

# E2E tests (Playwright) — covers multi-user collaboration flows
pnpm test:e2e

# Lint (ESLint across all packages)
pnpm lint
```

---

## Docker

```bash
# Build and start the entire stack (server + web)
docker compose up --build

# The app is then available at http://localhost:3000
```

The SQLite database is persisted in a Docker volume so data survives container restarts.

---

## Project Structure

```bash
code-duo/
├── apps/
│   ├── server/          # Node.js backend — WebSocket sync + REST API + SQLite
│   └── web/             # Next.js frontend — Monaco editor + Yjs providers
├── packages/
│   └── shared/          # Shared TypeScript types and constants
└── docs/
    ├── architecture.md  # System design, data flow, scaling considerations
    ├── crdt-explainer.md # Deep-dive on CRDTs vs OT, Yjs internals
    └── api.md           # REST API reference and WebSocket protocol
```

---

## Architecture Overview

An edit made by one user travels this path:

1. User types → Monaco fires a `change` event
2. `y-monaco` binding translates it into a Yjs operation on `Y.Text`
3. Yjs encodes it as a compact binary update
4. `y-websocket` provider sends it to `ws://host/yjs/<roomId>`
5. Server broadcasts it to all other clients in the same room (pure relay — no conflict resolution)
6. Each receiving client applies the update to its local `Y.Doc`
7. `y-monaco` translates the Yjs state change back into Monaco edit operations

The server does **zero conflict resolution** — that is handled entirely by Yjs's CRDT merge function, which is commutative, associative, and idempotent.

See [docs/architecture.md](docs/architecture.md) for the full system diagram and scaling discussion.

---

## License

MIT
