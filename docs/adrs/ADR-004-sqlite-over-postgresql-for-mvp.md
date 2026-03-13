# ADR-004: Choose SQLite Over PostgreSQL for MVP Persistence

## Status

Accepted

## Context

The MVP needs durable storage for room metadata and serialized Yjs document state. The initial target is 10+ concurrent users per room and 100+ rooms, deployed as a single server process. The team wants the lowest operational burden that still supports reliable persistence.

## Options Considered

1. SQLite via `better-sqlite3`
2. PostgreSQL
3. LevelDB or another embedded key-value store

## Decision

Use SQLite for MVP persistence.

## Rationale

- SQLite minimizes operational complexity. There is no separate database service, credentials layer, or connection pooling to manage.
- The persistence model is simple: `rooms` metadata plus Yjs document snapshots stored as binary blobs.
- WAL mode is sufficient for the current read-heavy, bursty-write workload of collaborative rooms on a single node.
- Migration cost is acceptable later because the schema is small and the storage boundaries are already explicit in the persistence layer.

## Trade-offs Accepted

- SQLite has a single-writer ceiling that becomes a limitation as room count and save frequency increase.
- High-availability, multi-node deployment is not practical with a single SQLite file.
- Database-level observability and ad hoc analytics are weaker than with PostgreSQL.
- The architecture intentionally optimizes for MVP speed over long-term horizontal scale.
