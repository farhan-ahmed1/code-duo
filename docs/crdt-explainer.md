# CRDT Deep Dive

Collaborative editing is a hard problem. When two people type at the same time without any coordination, you get conflicts. This document explains how Code Duo solves that problem using a data structure called a **CRDT**, why this approach is fundamentally different from the alternatives, and how the specific library we use — **Yjs** — works under the hood.

---

## What Is a CRDT?

**CRDT** stands for _Conflict-free Replicated Data Type_.

The name is a mouthful, but the idea is simple: a CRDT is a data structure designed so that **multiple copies of it can be edited independently and then merged automatically, without any conflicts, no matter what order the edits arrive**.

Think about two people editing a shared document while temporarily offline. When they reconnect, a magical merge function runs that combines both sets of changes into a result that is always correct and always the same — regardless of whose changes get merged first.

To make that work, a CRDT must satisfy three mathematical properties:

| Property          | What it means in plain English                                                               |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Commutativity** | `merge(A, B) = merge(B, A)` — it doesn't matter which edit arrives first                     |
| **Associativity** | `merge(merge(A, B), C) = merge(A, merge(B, C))` — it doesn't matter how you group the merges |
| **Idempotency**   | `merge(A, A) = A` — applying the same edit twice is safe; the duplicate is ignored           |

These three properties together mean you can deliver updates in any order, over any number of hops, with duplicates and retries — and every replica will always converge to the same state. No server arbitration required.

---

## CRDTs vs. Operational Transformation

Before CRDTs became practical, the dominant approach to collaborative editing was **Operational Transformation** (OT). Google Docs used OT for years. Understanding the difference helps explain why the industry has been moving toward CRDTs.

### How OT Works

OT represents each edit as an _operation_ (e.g. "insert 'x' at position 5"). When operations from two clients arrive at the server out of order, OT _transforms_ them against each other to compensate for the intervening changes.

Example: Client A inserts at position 5 while Client B deletes at position 3. The server receives both. To apply Client A's insert correctly it must adjust the target position from 5 to 4 (because Client B's delete shifted everything left). That adjustment is the "transformation."

### The Problem With OT

Transformation is straightforward for two clients and simple operations. It becomes extremely complex when you add more clients, more operation types, and network delays. The transformation functions must be correct for every combination of concurrent operations, and bugs in those functions are subtle and hard to reproduce.

OT also requires a **central server** to impose total ordering on operations. Without it, two clients applying the same pair of transformations in different orders can diverge. This is called the "CP2/TP2" problem, and it is why OT systems are notoriously difficult to implement correctly.

### How CRDTs Differ

CRDTs take a different approach: instead of transforming operations after the fact, they bake conflict resolution into the data structure itself.

Each character in a CRDT text document has a **globally unique, stable identifier** that never changes. Insert and delete operations reference these identifiers rather than positional indices. Because positions are stable, there is nothing to transform — operations commute naturally.

| Dimension                 | OT                                 | CRDT                                            |
| ------------------------- | ---------------------------------- | ----------------------------------------------- |
| Conflict resolution       | Transform operations at merge time | Encoded in the data structure                   |
| Central server            | Required for correctness           | Not required                                    |
| Implementation complexity | High (many edge cases)             | Moderate (complex data structure, simple merge) |
| Scalability               | Single point of coordination       | Peer-to-peer capable                            |
| Offline support           | Possible but complex               | First-class                                     |
| Undo semantics            | Can be complex to implement        | Straightforward with persistent history         |

**When to use OT:** You control both the client and server, have a single central coordinator, and need very fine-grained real-time performance (OT can be faster for simple cases because the data structure is just a string).

**When to use CRDTs:** You want offline-first behaviour, peer-to-peer sync, or a simpler deployment model. Also the right choice when you can't guarantee a central coordinator is always available.

---

## How Yjs Works Internally

Yjs uses an algorithm called **YATA** (Yet Another Transformation Approach). It is not pure OT — it is a CRDT that borrows some ideas from OT to produce a particularly compact encoding.

### Every Character Gets a Unique Identity

When you type a character in Code Duo, Yjs assigns it a unique identifier called an **item**:

```bash
Item {
  id: { client: 1234567890, clock: 42 },  // unique identifier
  content: "x",                            // the character
  left: { client: 1234567890, clock: 41 }, // what it comes after
  right: { client: 0, clock: 0 },          // what it comes before (null if end)
  deleted: false                           // tombstone flag
}
```

- `client` is a random integer generated when the Yjs document is first created in that browser tab.
- `clock` is a monotonically increasing counter, incremented with every operation from that client.

Together, `(client, clock)` forms a globally unique identifier called a **Lamport timestamp**. Two clients can never generate the same `(client, clock)` pair — the clock ensures uniqueness within a client, and the random client ID ensures uniqueness across clients.

### The Linked List Structure

Yjs stores the document as a **doubly-linked list of items**. Each item points to the item logically to its left and right. This is not a positional index — it is a reference to a specific item's identity.

```bash
[START] <-> Item(A, c=0) <-> Item(B, c=1) <-> Item(X, c=2) <-> [END]
```

When you insert "y" between "B" and "X", the new item records the identities of its neighbours:

```bash
new Item {
  id: { client: 9876, clock: 5 },
  content: "y",
  left: { client: B's id },
  right: { client: X's id }
}
```

The list becomes:

```bash
[START] <-> Item(A) <-> Item(B) <-> Item(y) <-> Item(X) <-> [END]
```

This works even if both clients insert at the same position simultaneously — because "left" and "right" are identities, not positions.

### Resolving Concurrent Inserts at the Same Position

What happens if two clients both insert between "B" and "X" at exactly the same moment?

Client 1 inserts "y" with `left = B.id`.
Client 2 inserts "z" with `left = B.id`.

Both operations are valid. Yjs resolves this using a **deterministic tiebreaker**: compare the client IDs numerically. The client with the higher ID wins and its character is placed to the left of the other. This is the same comparison on both sides, so both clients arrive at the same final order without coordination.

Result: `... B → y → z → X ...` (assuming Client 1's ID > Client 2's ID)
or: `... B → z → y → X ...` (if Client 2's ID is higher)

The specific order is arbitrary, but it is the **same arbitrary order** on every device.

### Tombstones: How Deletes Work

In a CRDT, you cannot simply remove an item from the list when it is deleted — another client might be trying to insert relative to that item at the same moment.

Instead, deleted items become **tombstones**: the `deleted` flag is set to `true`, but the item remains in the list. When rendering the document, Yjs skips tombstoned items.

```bash
[START] <-> Item(A) <-> Item(B, deleted=true) <-> Item(y) <-> Item(X) <-> [END]
```

"B" is invisible to the user but still present in the data structure. Any pending insert that referenced "B" as a neighbour can still be correctly placed.

Tombstones are cleaned up by **garbage collection** whenever it is safe to do so — specifically, when all clients have acknowledged that they have seen the deletion. With `gc: true` (the setting Code Duo uses), Yjs runs GC automatically.

### State Vectors and Sync

When two clients connect, they need to figure out what updates the other is missing. They do this by exchanging **state vectors**.

A state vector is a map from `clientId → highestClock`. It compactly summarises everything a client has seen:

```bas
{ 1234567890: 42, 9876543210: 17, 4567890123: 5 }
```

On connect, Client A sends its state vector to the server. The server computes the diff — updates that Client A hasn't seen yet — and sends only those. This is the "sync" phase that fires the `sync` event you see in `useConnectionStatus`.

After the initial sync, clients just stream incremental updates as they type.

---

## Awareness: The Ephemeral Layer

The presence bar showing who is in the room, and the live cursor positions, are **not** part of the Yjs CRDT document. They use a separate system called the **awareness protocol**.

### Why They Are Separate

The CRDT document is designed for **permanent, durable data** — text content that should survive disconnections, be persisted to the server, and always converge. Every operation is stored forever (or until GC).

Cursor positions and connection status are **ephemeral** — they are only meaningful right now, and they change dozens of times per second. Storing every cursor movement in the persistent CRDT would be extremely wasteful. Awareness is designed to be throw-away.

### How Awareness Works

Each client has an **awareness state** — a plain JSON object:

```json
{
  "user": { "id": "abc", "name": "Farhan", "color": "#4ECDC4" },
  "connectedAt": 1700000000000,
  "cursorPosition": { "index": 42, "length": 0 }
}
```

Awareness states are broadcast to all other clients via the WebSocket connection. They are **not persisted** to SQLite. When a client disconnects, their awareness state is removed after a 30-second timeout (the default awareness timeout in y-websocket).

The awareness protocol guarantees last-write-wins (LWW) semantics per client. You can update your own state but not anyone else's. This is weaker than the CRDT guarantees but sufficient for ephemeral presence data.

---

## Performance Characteristics

### Document Size Growth

Yjs documents grow over time because tombstones accumulate. A document where 10,000 characters were typed and then deleted is larger than one where 10,000 characters were typed and kept, even though both render as the same size.

In practice this is rarely a problem for code editing. A large source file (10,000 lines) with heavy editing history stays well under 1 MB. The benchmark data in [ARCHITECTURE.md](architecture.md#document-load-time) shows that even a 1 MB Yjs document loads in under 1.2 seconds on localhost.

Garbage collection (`gc: true`) helps by reclaiming tombstones when all known clients have seen the deletions. It runs incrementally during normal operation.

### Encoding Efficiency

Yjs uses a highly compact binary encoding for its updates. The `Y.encodeStateAsUpdate` output is run-length encoded and uses variable-length integers — significantly smaller than a JSON representation of the same data.

A typical coding session generating a few thousand operations produces a state vector of 10–50 KB. A very large document with extensive editing history might reach 500 KB. Both are handled efficiently by SQLite BLOB storage and IndexedDB.

### Undo/Redo

Yjs includes a `UndoManager` that operates on the CRDT level. It tracks operations from the _local_ client only (not remote operations) and can invert them. This means undo only undoes your own changes, which is the correct behaviour in a collaborative editor — you should not undo your collaborator's work.

Code Duo sets up the `UndoManager` through the `MonacoBinding`, scoped to the `Y.Text` instance for the editor content.

---

## Real-World CRDT Deployments

CRDTs are not academic exercises — they power some of the world's most widely used collaborative software.

### Figma

Figma's design canvas uses CRDTs to synchronise vector objects (shapes, layers, properties) across clients. Each object property is stored as a CRDT register with LWW semantics. This lets Figma handle simultaneous property changes (two people adjusting the same element's colour at the same time) without server-side arbitration.

Figma's multiplayer system was an early sign that CRDTs were practical at scale. Their 2019 blog post on the topic is frequently cited in the distributed systems community.

### Google Docs

Google Docs originally used OT. Google later moved toward CRDT-inspired approaches in newer products. The shift reflects the industry's growing recognition that CRDT implementations, while complex to write, are more scalable and more amenable to offline support than OT.

### Apple Notes / iCloud

Apple's collaboration infrastructure uses CRDTs for syncing Notes, Reminders, and other iCloud data across devices. The offline-first nature of CRDTs is essential here — your iPhone edits Notes on the train with no signal, and everything merges correctly when you get back to WiFi.

### Linear

Linear, the project management tool, uses CRDTs under the hood for their collaborative features. Their engineering team has written extensively about the tradeoffs.

---

## Common Questions

**Q: If two people type at the same character position simultaneously, which character "wins"?**

Neither wins or loses — both characters end up in the document. Yjs uses a deterministic tiebreaker (comparing client IDs) to decide their relative order. The result is always the same on every client.

**Q: What happens if the server goes down while two clients are editing?**

Each client continues editing locally. `y-indexeddb` persists all changes to IndexedDB. When the server comes back, the clients reconnect, exchange state vectors, and merge any diverged changes. No data is lost.

**Q: Can someone send a malicious Yjs update to corrupt the document?**

Yjs applies updates by merging them into the local state. A malformed update can be rejected by the CRDT merge function, but there is no access control at the document level in Code Duo. A client that has the room URL can send any update. This is a known limitation — production systems would add server-side update validation or per-user access control.

**Q: Why does the Yjs document keep growing even if I delete everything?**

Deleted items become tombstones and remain in the data structure until GC runs. GC requires all known clients to have acknowledged the deletion. If a client was connected, went offline, and never reconnected, GC cannot collect tombstones that the offline client might still reference. In practice, GC runs successfully after a short time in well-connected sessions.

**Q: Is a Yjs text document just a long linked list? Isn't that O(n) for random access?**

Yes, the underlying structure is a linked list. Random access is O(n) in theory. In practice, Yjs maintains a _skip list_ layer for faster position lookups, and the `MonacoBinding` batches position calculations. For documents up to a few million characters (far larger than any typical code file), the performance is acceptable.

**Q: How does Yjs compare to Automerge?**

Both implement CRDTs for collaborative text. The key differences from Code Duo's perspective:

|                    | Yjs                                | Automerge                               |
| ------------------ | ---------------------------------- | --------------------------------------- |
| Algorithm          | YATA (linked list)                 | RGA (sequence CRDT)                     |
| Monaco integration | Official `y-monaco` binding        | Manual integration                      |
| Encoding size      | Very compact (binary, run-length)  | Larger (JSON-based in v1; binary in v2) |
| GC support         | Built-in                           | Limited                                 |
| Ecosystem          | y-websocket, y-indexeddb, y-webrtc | Automerge-repo (newer, active)          |

Yjs was chosen because the ecosystem fit is better for this stack. See [ARCHITECTURE.md](architecture.md#yjs-over-automerge) for the full rationale.
