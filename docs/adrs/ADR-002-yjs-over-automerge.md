# ADR-002: Choose Yjs Over Automerge

## Status

Accepted

## Context

After choosing CRDTs, the project needs a production-ready CRDT library for collaborative text editing in the browser, durable persistence on the server, and real-time synchronization over WebSocket. The editor integration must work well with Monaco and support awareness and offline caching with minimal custom glue.

## Options Considered

1. Yjs
2. Automerge
3. A custom CRDT implementation

## Decision

Use Yjs as the shared document engine.

## Rationale

- Yjs has the strongest ecosystem fit for this product: `y-websocket`, `y-indexeddb`, `y-monaco`, and `y-protocols/awareness` work together directly.
- The existing codebase already benefits from Yjs' efficient binary update format and mature text-collaboration model.
- Yjs is well-suited for editor-style sequential text workloads, where update size and merge speed matter more than JSON document ergonomics.
- The Monaco integration is materially better with Yjs because `y-monaco` already handles model binding and awareness hooks.

## Trade-offs Accepted

- The Yjs API and binary update model are less self-describing than Automerge's higher-level document ergonomics.
- Some operational internals are harder for new contributors to inspect than plain JSON state.
- The project depends on Yjs-specific packages rather than a more generic collaboration abstraction.
- Replacing Yjs later would require reworking editor bindings, offline persistence, and sync providers.
