# ADR-001: Choose CRDTs Over Operational Transformation

## Status

Accepted

## Context

Code Duo is a real-time collaborative code editor where multiple users edit the same document concurrently, including while disconnected. The server uses `y-websocket`, which acts as a relay and persistence hook rather than a central conflict resolver. The architecture therefore needs a collaboration model that converges correctly even when clients reconnect out of order.

## Options Considered

1. CRDTs with client-side convergence
2. Operational Transformation with a central authoritative server
3. Simple last-write-wins document replacement

## Decision

Use CRDTs for shared document state and conflict resolution.

## Rationale

- CRDTs match the product constraint that clients must continue editing while offline and merge later without server arbitration.
- The relay-style `y-websocket` model works naturally with CRDT updates because updates are commutative, associative, and idempotent.
- CRDTs reduce server complexity. The server forwards updates and persists state; it does not need to impose operation ordering or maintain per-client transformation context.
- The consistency model is well aligned with local-first UX. Each browser remains authoritative for its local state until synchronization resumes.

## Trade-offs Accepted

- Client memory usage is higher than a naive text buffer because CRDT metadata and tombstones must be tracked.
- Debugging binary CRDT updates is harder than debugging line-based operations.
- Long-lived heavily edited documents need compaction or garbage collection discipline over time.
- Deterministic convergence is prioritized over minimal implementation complexity.
