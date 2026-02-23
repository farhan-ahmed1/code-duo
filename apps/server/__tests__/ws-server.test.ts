import { describe, it, expect, vi } from 'vitest';
import * as Y from 'yjs';

// Smoke tests for WebSocket server setup
// Full integration tests are covered in Playwright E2E suite

describe('WebSocket server', () => {
  it('Yjs documents with the same room name converge', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Simulate the relay: A sends update, B receives it
    docA.on('update', (update: Uint8Array) => {
      Y.applyUpdate(docB, update);
    });

    docA.getText('monaco').insert(0, 'hello');

    expect(docB.getText('monaco').toString()).toBe('hello');
  });

  it('concurrent edits from two docs converge to the same state', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const updatesA: Uint8Array[] = [];
    const updatesB: Uint8Array[] = [];

    docA.on('update', (u: Uint8Array) => updatesA.push(u));
    docB.on('update', (u: Uint8Array) => updatesB.push(u));

    // Both edit without seeing each other's changes
    docA.getText('monaco').insert(0, 'AAA');
    docB.getText('monaco').insert(0, 'BBB');

    // Exchange updates (simulate relay)
    updatesA.forEach((u) => Y.applyUpdate(docB, u));
    updatesB.forEach((u) => Y.applyUpdate(docA, u));

    // Both converge
    expect(docA.getText('monaco').toString()).toBe(docB.getText('monaco').toString());
  });

  it('CRDT merge is idempotent — applying the same update twice is safe', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    docA.getText('monaco').insert(0, 'hello');
    const update = Y.encodeStateAsUpdate(docA);

    Y.applyUpdate(docB, update);
    Y.applyUpdate(docB, update); // apply twice

    expect(docB.getText('monaco').toString()).toBe('hello');
  });
});
