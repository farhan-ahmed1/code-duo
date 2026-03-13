# ADR-007: Keep Awareness Data Ephemeral

## Status

Accepted

## Context

Code Duo needs collaborative presence features such as cursor identity, connection state, and active-user display. These signals are useful in-session but are not part of the durable source of truth for the document itself. The product also needs to avoid writing noisy transient presence updates into the persistence path.

## Options Considered

1. Ephemeral awareness only, with durable persistence limited to document state and room metadata
2. Persist awareness snapshots alongside the document
3. Persist full presence history for replay and analytics

## Decision

Use the Yjs awareness protocol as ephemeral session state only. Persist document state and room metadata, but do not persist cursors, transient identities, or presence snapshots.

## Rationale

- Awareness changes are high-frequency and lose value quickly; persisting them would add write amplification with little product value.
- Replaying stale cursor positions after reconnect would be misleading and degrade UX.
- Treating awareness as ephemeral keeps the durability boundary clear: the document is durable, presence is live session state.
- The current presence UI only needs active session state, which `y-websocket` awareness already provides.

## Trade-offs Accepted

- Presence disappears on disconnect or server restart rather than being restored.
- Historical session analytics require a separate telemetry pipeline if needed later.
- Users do not get "last seen cursor" or reconnection replay semantics.
- The system favors correctness and simplicity over preserving transient collaboration context.
