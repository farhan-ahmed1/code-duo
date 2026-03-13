# Architecture Decision Records

These ADRs capture the key architectural decisions for Code Duo's MVP collaboration stack.

## Status

- ✅ [ADR-001](./ADR-001-crdts-over-ot.md) — Choose CRDTs over Operational Transformation for collaborative editing.
- ✅ [ADR-002](./ADR-002-yjs-over-automerge.md) — Choose Yjs over Automerge for the shared document engine.
- ✅ [ADR-003](./ADR-003-monaco-over-codemirror.md) — Choose Monaco Editor over CodeMirror for the primary editor.
- ✅ [ADR-004](./ADR-004-sqlite-over-postgresql-for-mvp.md) — Choose SQLite over PostgreSQL for MVP persistence.
- ✅ [ADR-005](./ADR-005-hono-over-express-fastify.md) — Choose Hono over Express and Fastify for the HTTP layer.
- ✅ [ADR-006](./ADR-006-monorepo-with-pnpm-and-turborepo.md) — Choose a pnpm + Turborepo monorepo.
- ✅ [ADR-007](./ADR-007-ephemeral-awareness-protocol.md) — Keep awareness data ephemeral and out of durable storage.

## Notes

- Status for all ADRs is `Accepted` for the current MVP architecture.
- The system design companion document lives in [../architecture.md](../architecture.md).
- ADRs are scoped to the current implementation: Next.js web app, Hono + WebSocket server, Yjs collaboration, and SQLite durability.
