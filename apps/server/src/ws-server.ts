import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "node:http";
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import { DocumentStore } from "./persistence/document-store";
import { RoomStore } from "./persistence/room-store";
import { logger } from "./utils/logger";
import {
  activeConnections,
  activeRooms,
  messagesTotal,
  documentSavesTotal,
} from "./utils/metrics";
import * as Y from "yjs";
import { DOCUMENT_DEBOUNCE_MS } from "@code-duo/shared/src/constants";

const documentStore = new DocumentStore();
const roomStore = new RoomStore();
const roomConnectionCounts = new Map<string, number>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Export for use by the cleanup job
export { documentStore, roomStore as wsRoomStore };

function getRoomNameFromUrl(url: string): string {
  // URL format: /yjs/:roomId
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "default";
}

function scheduleSave(roomId: string, ydoc: Y.Doc) {
  const existing = saveTimers.get(roomId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    const state = Y.encodeStateAsUpdate(ydoc);
    documentStore.saveDocument(roomId, state);
    documentSavesTotal.inc();
    logger.info({ roomId }, "Document persisted");
    saveTimers.delete(roomId);
  }, DOCUMENT_DEBOUNCE_MS);

  saveTimers.set(roomId, timer);
}

// Wire DocumentStore into y-websocket's persistence lifecycle.
// bindState: called once when a room's Y.Doc is first requested — loads persisted state.
// writeState: called when the last client disconnects — triggers a final save.
setPersistence({
  bindState: async (roomId: string, ydoc: Y.Doc) => {
    const saved = documentStore.loadDocument(roomId);
    if (saved) {
      Y.applyUpdate(ydoc, saved);
      logger.info({ roomId }, "Document state restored from storage");
    }
    // Schedule incremental saves on every update
    ydoc.on("update", () => scheduleSave(roomId, ydoc));
  },
  writeState: async (roomId: string, ydoc: Y.Doc) => {
    const state = Y.encodeStateAsUpdate(ydoc);
    documentStore.saveDocument(roomId, state);
    documentSavesTotal.inc();
    logger.info({ roomId }, "Document state flushed on last disconnect");
  },
});

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url ?? "/";
    const roomId = getRoomNameFromUrl(url);

    // Track connection counts
    const count = (roomConnectionCounts.get(roomId) ?? 0) + 1;
    roomConnectionCounts.set(roomId, count);
    activeConnections.inc();
    if (count === 1) activeRooms.inc();

    logger.info({ roomId, totalInRoom: count }, "Client connected");

    // Update accessed_at so the room survives expiration cleanup
    roomStore.touchRoom(roomId);

    // y-websocket handles the Yjs sync protocol
    setupWSConnection(ws, req, {
      docName: roomId,
      gc: true,
    });

    ws.on("message", () => {
      messagesTotal.inc();
    });

    ws.on("close", () => {
      const remaining = Math.max(
        0,
        (roomConnectionCounts.get(roomId) ?? 1) - 1,
      );
      roomConnectionCounts.set(roomId, remaining);
      activeConnections.dec();
      if (remaining === 0) {
        activeRooms.dec();
        roomConnectionCounts.delete(roomId);
      }
      logger.info({ roomId, remaining }, "Client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ roomId, err }, "WebSocket error");
    });
  });
}
