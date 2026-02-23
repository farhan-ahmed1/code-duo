import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as Y from "yjs";
import { DocumentStore } from "../src/persistence/document-store.js";

describe("DocumentStore", () => {
  let store: DocumentStore;

  beforeEach(() => {
    store = new DocumentStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("saves and loads a Yjs document state", () => {
    const ydoc = new Y.Doc();
    ydoc.getText("content").insert(0, "Hello, World!");
    const state = Y.encodeStateAsUpdate(ydoc);

    store.saveDocument("room-1", state);

    const loaded = store.loadDocument("room-1");
    expect(loaded).not.toBeNull();

    const restoredDoc = new Y.Doc();
    Y.applyUpdate(restoredDoc, loaded!);
    expect(restoredDoc.getText("content").toString()).toBe("Hello, World!");
  });

  it("returns null for non-existent room", () => {
    expect(store.loadDocument("no-such-room")).toBeNull();
  });

  it("overwrites existing document on save", () => {
    const doc1 = new Y.Doc();
    doc1.getText("t").insert(0, "First");
    store.saveDocument("room-x", Y.encodeStateAsUpdate(doc1));

    const doc2 = new Y.Doc();
    doc2.getText("t").insert(0, "Second");
    store.saveDocument("room-x", Y.encodeStateAsUpdate(doc2));

    const loaded = store.loadDocument("room-x");
    const restored = new Y.Doc();
    Y.applyUpdate(restored, loaded!);
    expect(restored.getText("t").toString()).toBe("Second");
  });

  it("handles large documents", () => {
    const ydoc = new Y.Doc();
    const text = ydoc.getText("content");
    const largeContent = "x".repeat(100_000);
    text.insert(0, largeContent);

    const state = Y.encodeStateAsUpdate(ydoc);
    store.saveDocument("large-doc", state);

    const loaded = store.loadDocument("large-doc");
    const restored = new Y.Doc();
    Y.applyUpdate(restored, loaded!);
    expect(restored.getText("content").length).toBe(100_000);
  });

  it("deletes a document", () => {
    const ydoc = new Y.Doc();
    store.saveDocument("to-delete", Y.encodeStateAsUpdate(ydoc));
    store.deleteDocument("to-delete");
    expect(store.loadDocument("to-delete")).toBeNull();
  });
});
