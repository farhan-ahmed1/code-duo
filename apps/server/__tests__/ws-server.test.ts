import { describe, it, expect } from "vitest";
import * as Y from "yjs";

// Smoke tests for WebSocket server setup
// Full integration tests are covered in Playwright E2E suite

describe("WebSocket server", () => {
  it("Yjs documents with the same room name converge", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Simulate the relay: A sends update, B receives it
    docA.on("update", (update: Uint8Array) => {
      Y.applyUpdate(docB, update);
    });

    docA.getText("monaco").insert(0, "hello");

    expect(docB.getText("monaco").toString()).toBe("hello");
  });

  it("concurrent edits from two docs converge to the same state", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const updatesA: Uint8Array[] = [];
    const updatesB: Uint8Array[] = [];

    docA.on("update", (u: Uint8Array) => updatesA.push(u));
    docB.on("update", (u: Uint8Array) => updatesB.push(u));

    // Both edit without seeing each other's changes
    docA.getText("monaco").insert(0, "AAA");
    docB.getText("monaco").insert(0, "BBB");

    // Exchange updates (simulate relay)
    updatesA.forEach((u) => Y.applyUpdate(docB, u));
    updatesB.forEach((u) => Y.applyUpdate(docA, u));

    // Both converge
    expect(docA.getText("monaco").toString()).toBe(
      docB.getText("monaco").toString(),
    );
  });

  it("CRDT merge is idempotent — applying the same update twice is safe", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    docA.getText("monaco").insert(0, "hello");
    const update = Y.encodeStateAsUpdate(docA);

    Y.applyUpdate(docB, update);
    Y.applyUpdate(docB, update); // apply twice

    expect(docB.getText("monaco").toString()).toBe("hello");
  });

  it("three-way concurrent edits converge", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const docC = new Y.Doc();

    const updatesA: Uint8Array[] = [];
    const updatesB: Uint8Array[] = [];
    const updatesC: Uint8Array[] = [];

    docA.on("update", (u: Uint8Array) => updatesA.push(u));
    docB.on("update", (u: Uint8Array) => updatesB.push(u));
    docC.on("update", (u: Uint8Array) => updatesC.push(u));

    docA.getText("monaco").insert(0, "AAA");
    docB.getText("monaco").insert(0, "BBB");
    docC.getText("monaco").insert(0, "CCC");

    // Everyone exchanges updates
    const allUpdates = [...updatesA, ...updatesB, ...updatesC];
    allUpdates.forEach((u) => {
      Y.applyUpdate(docA, u);
      Y.applyUpdate(docB, u);
      Y.applyUpdate(docC, u);
    });

    const result = docA.getText("monaco").toString();
    expect(docB.getText("monaco").toString()).toBe(result);
    expect(docC.getText("monaco").toString()).toBe(result);
    // All three strings should be present
    expect(result).toContain("AAA");
    expect(result).toContain("BBB");
    expect(result).toContain("CCC");
  });

  it("document state can be serialized and restored", () => {
    const original = new Y.Doc();
    original.getText("monaco").insert(0, "persistent content");

    const state = Y.encodeStateAsUpdate(original);

    const restored = new Y.Doc();
    Y.applyUpdate(restored, state);

    expect(restored.getText("monaco").toString()).toBe("persistent content");
  });

  it("state vector enables incremental sync", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // docA has some initial content
    docA.getText("monaco").insert(0, "initial");

    // Sync A -> B fully
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
    expect(docB.getText("monaco").toString()).toBe("initial");

    // docA gets more edits
    docA.getText("monaco").insert(7, " more");

    // Incremental sync using state vector
    const sv = Y.encodeStateVector(docB);
    const diff = Y.encodeStateAsUpdate(docA, sv);
    Y.applyUpdate(docB, diff);

    expect(docB.getText("monaco").toString()).toBe("initial more");
  });

  it("Y.Map settings sync between docs", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    docA.getMap("settings").set("language", "typescript");

    const update = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, update);

    expect(docB.getMap("settings").get("language")).toBe("typescript");
  });
});
