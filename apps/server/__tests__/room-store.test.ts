import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomStore } from '../src/persistence/room-store.js';

describe('RoomStore', () => {
  let store: RoomStore;

  beforeEach(() => {
    store = new RoomStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  it('creates a room and returns it', () => {
    const room = store.createRoom('Test Room', 'typescript');
    expect(room.id).toBeDefined();
    expect(room.name).toBe('Test Room');
    expect(room.language).toBe('typescript');
    expect(room.createdAt).toBeDefined();
  });

  it('retrieves a room by id', () => {
    const created = store.createRoom('My Room', 'python');
    const fetched = store.getRoom(created.id);
    expect(fetched).toMatchObject({ id: created.id, name: 'My Room', language: 'python' });
  });

  it('returns null for non-existent room', () => {
    expect(store.getRoom('nonexistent')).toBeNull();
  });

  it('lists rooms with pagination', () => {
    store.createRoom('Room A', 'typescript');
    store.createRoom('Room B', 'javascript');
    store.createRoom('Room C', 'python');

    const page1 = store.listRooms(2, 0);
    expect(page1).toHaveLength(2);

    const page2 = store.listRooms(2, 2);
    expect(page2).toHaveLength(1);
  });

  it('updates room fields', () => {
    const room = store.createRoom('Old Name', 'typescript');
    const updated = store.updateRoom(room.id, { name: 'New Name' });
    expect(updated?.name).toBe('New Name');
    expect(updated?.language).toBe('typescript');
  });

  it('deletes a room', () => {
    const room = store.createRoom('To Delete', 'go');
    store.deleteRoom(room.id);
    expect(store.getRoom(room.id)).toBeNull();
  });

  it('allows duplicate room names', () => {
    store.createRoom('Same Name', 'typescript');
    store.createRoom('Same Name', 'typescript');
    const rooms = store.listRooms(10, 0);
    expect(rooms.filter((r) => r.name === 'Same Name')).toHaveLength(2);
  });
});
