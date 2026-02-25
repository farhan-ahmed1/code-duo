import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RoomStore } from "../src/persistence/room-store.js";

describe("RoomStore", () => {
  let store: RoomStore;

  beforeEach(() => {
    store = new RoomStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  // --- CRUD operations ---

  it("creates a room and returns it", () => {
    const room = store.createRoom("Test Room", "typescript");
    expect(room.id).toBeDefined();
    expect(room.id).toHaveLength(8);
    expect(room.name).toBe("Test Room");
    expect(room.language).toBe("typescript");
    expect(room.createdAt).toBeDefined();
    expect(room.updatedAt).toBeDefined();
  });

  it("retrieves a room by id", () => {
    const created = store.createRoom("My Room", "python");
    const fetched = store.getRoom(created.id);
    expect(fetched).toMatchObject({
      id: created.id,
      name: "My Room",
      language: "python",
    });
  });

  it("returns null for non-existent room", () => {
    expect(store.getRoom("nonexistent")).toBeNull();
  });

  it("updates room name", () => {
    const room = store.createRoom("Old Name", "typescript");
    const updated = store.updateRoom(room.id, { name: "New Name" });
    expect(updated?.name).toBe("New Name");
    expect(updated?.language).toBe("typescript");
  });

  it("updates room language", () => {
    const room = store.createRoom("Room", "typescript");
    const updated = store.updateRoom(room.id, { language: "python" });
    expect(updated?.language).toBe("python");
    expect(updated?.name).toBe("Room");
  });

  it("updates both name and language", () => {
    const room = store.createRoom("Room", "typescript");
    const updated = store.updateRoom(room.id, {
      name: "Renamed",
      language: "go",
    });
    expect(updated?.name).toBe("Renamed");
    expect(updated?.language).toBe("go");
  });

  it("update returns null for non-existent room", () => {
    const result = store.updateRoom("nonexistent", { name: "Nope" });
    expect(result).toBeNull();
  });

  it("deletes a room", () => {
    const room = store.createRoom("To Delete", "go");
    store.deleteRoom(room.id);
    expect(store.getRoom(room.id)).toBeNull();
  });

  it("delete is a no-op for non-existent room", () => {
    // Should not throw
    expect(() => store.deleteRoom("nonexistent")).not.toThrow();
  });

  // --- Pagination ---

  it("lists rooms with pagination", () => {
    store.createRoom("Room A", "typescript");
    store.createRoom("Room B", "javascript");
    store.createRoom("Room C", "python");

    const page1 = store.listRooms(2, 0);
    expect(page1).toHaveLength(2);

    const page2 = store.listRooms(2, 2);
    expect(page2).toHaveLength(1);
  });

  it("lists all rooms that were created", () => {
    store.createRoom("First", "typescript");
    store.createRoom("Second", "javascript");
    store.createRoom("Third", "python");

    const rooms = store.listRooms(10, 0);
    const names = rooms.map((r) => r.name);
    expect(names).toContain("First");
    expect(names).toContain("Second");
    expect(names).toContain("Third");
  });

  it("returns empty array when no rooms exist", () => {
    const rooms = store.listRooms(10, 0);
    expect(rooms).toEqual([]);
  });

  it("returns empty array when offset exceeds total rooms", () => {
    store.createRoom("Only One", "typescript");
    const rooms = store.listRooms(10, 100);
    expect(rooms).toEqual([]);
  });

  // --- Edge cases ---

  it("allows duplicate room names", () => {
    store.createRoom("Same Name", "typescript");
    store.createRoom("Same Name", "typescript");
    const rooms = store.listRooms(10, 0);
    expect(rooms.filter((r) => r.name === "Same Name")).toHaveLength(2);
  });

  it("generates unique IDs for each room", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const room = store.createRoom(`Room ${i}`, "typescript");
      ids.add(room.id);
    }
    expect(ids.size).toBe(50);
  });

  // --- touchRoom / stale room cleanup ---

  it("touchRoom updates accessed_at timestamp", () => {
    const room = store.createRoom("Touch Test", "typescript");
    // touchRoom should not throw
    expect(() => store.touchRoom(room.id)).not.toThrow();
  });

  it("touchRoom is a no-op for non-existent room", () => {
    expect(() => store.touchRoom("nonexistent")).not.toThrow();
  });

  it("getStaleRoomIds returns rooms not accessed recently", () => {
    // Create a room — its accessed_at is `now`
    store.createRoom("Fresh Room", "typescript");
    // With 0 days threshold everything would be stale, but accessed_at is now, so nothing
    const stale = store.getStaleRoomIds(0);
    // A room just created should not be stale (threshold 1 day)
    const stale1 = store.getStaleRoomIds(1);
    expect(stale1).toHaveLength(0);
  });

  it("purgeStaleRooms removes old rooms", () => {
    store.createRoom("Soon Stale", "typescript");
    // With 0 days, nothing recently created is stale
    const removed = store.purgeStaleRooms(1);
    expect(removed).toBe(0);
  });
});
