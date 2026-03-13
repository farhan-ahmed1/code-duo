import { afterEach, describe, expect, it } from "vitest";
import {
  decrementRoomConnection,
  getRealtimeStats,
  getRoomConnectionCount,
  incrementRoomConnection,
} from "../src/utils/realtime-stats.js";

describe("realtime-stats", () => {
  const touchedRoomIds = new Set<string>();

  afterEach(() => {
    for (const roomId of touchedRoomIds) {
      while (getRoomConnectionCount(roomId) > 0) {
        decrementRoomConnection(roomId);
      }
    }
    touchedRoomIds.clear();
  });

  it("tracks incremented room connection counts", () => {
    const roomId = `room-${crypto.randomUUID()}`;
    touchedRoomIds.add(roomId);

    expect(incrementRoomConnection(roomId)).toBe(1);
    expect(incrementRoomConnection(roomId)).toBe(2);
    expect(getRoomConnectionCount(roomId)).toBe(2);
  });

  it("decrement removes room entry when the last connection closes", () => {
    const roomId = `room-${crypto.randomUUID()}`;
    touchedRoomIds.add(roomId);

    incrementRoomConnection(roomId);

    expect(decrementRoomConnection(roomId)).toBe(0);
    expect(getRoomConnectionCount(roomId)).toBe(0);
  });

  it("decrement clamps unknown rooms at zero", () => {
    const roomId = `room-${crypto.randomUUID()}`;
    touchedRoomIds.add(roomId);

    expect(decrementRoomConnection(roomId)).toBe(0);
    expect(getRoomConnectionCount(roomId)).toBe(0);
  });

  it("aggregates active room and connection totals", () => {
    const roomA = `room-${crypto.randomUUID()}`;
    const roomB = `room-${crypto.randomUUID()}`;
    touchedRoomIds.add(roomA);
    touchedRoomIds.add(roomB);

    incrementRoomConnection(roomA);
    incrementRoomConnection(roomA);
    incrementRoomConnection(roomB);

    expect(getRealtimeStats()).toMatchObject({
      activeConnections: 3,
      activeRooms: 2,
    });
  });
});