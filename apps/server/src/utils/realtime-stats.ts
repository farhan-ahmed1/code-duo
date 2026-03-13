const roomConnectionCounts = new Map<string, number>();

export function incrementRoomConnection(roomId: string): number {
  const count = (roomConnectionCounts.get(roomId) ?? 0) + 1;
  roomConnectionCounts.set(roomId, count);
  return count;
}

export function decrementRoomConnection(roomId: string): number {
  const remaining = Math.max(0, (roomConnectionCounts.get(roomId) ?? 1) - 1);

  if (remaining === 0) {
    roomConnectionCounts.delete(roomId);
    return 0;
  }

  roomConnectionCounts.set(roomId, remaining);
  return remaining;
}

export function getRoomConnectionCount(roomId: string): number {
  return roomConnectionCounts.get(roomId) ?? 0;
}

export function getRealtimeStats() {
  return {
    activeConnections: Array.from(roomConnectionCounts.values()).reduce(
      (total, count) => total + count,
      0,
    ),
    activeRooms: roomConnectionCounts.size,
  };
}
