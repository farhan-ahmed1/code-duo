import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "node:http";
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import { DocumentStore } from "./persistence/document-store";
import { RoomStore } from "./persistence/room-store";
import { logger, createContextLogger } from "./utils/logger";
import {
  activeConnections,
  activeRooms,
  messagesTotal,
  documentSavesTotal,
} from "./utils/metrics";
import {
  incrementRoomConnection,
  decrementRoomConnection,
} from "./utils/realtime-stats";
import * as Y from "yjs";
import { DOCUMENT_DEBOUNCE_MS } from "@code-duo/shared";

const documentStore = new DocumentStore();
const roomStore = new RoomStore();
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
    const start = performance.now();
    const state = Y.encodeStateAsUpdate(ydoc);
    documentStore.saveDocument(roomId, state);
    documentSavesTotal.inc();
    const duration = Math.round(performance.now() - start);
    logger.info(
      { roomId, event: "doc_persist", duration, bytes: state.byteLength },
      "Document persisted",
    );
    saveTimers.delete(roomId);
  }, DOCUMENT_DEBOUNCE_MS);

  saveTimers.set(roomId, timer);
}

// Wire DocumentStore into y-websocket's persistence lifecycle.
// bindState: called once when a room's Y.Doc is first requested — loads persisted state.
// writeState: called when the last client disconnects — triggers a final save.
setPersistence({
  bindState: async (roomId: string, ydoc: Y.Doc) => {
    const start = performance.now();
    const saved = documentStore.loadDocument(roomId);
    if (saved) {
      Y.applyUpdate(ydoc, saved);
      const duration = Math.round(performance.now() - start);
      logger.info(
        { roomId, event: "doc_restore", duration, bytes: saved.byteLength },
        "Document state restored from storage",
      );
    }
    // Schedule incremental saves on every update
    ydoc.on("update", () => scheduleSave(roomId, ydoc));
  },
  writeState: async (roomId: string, ydoc: Y.Doc) => {
    const start = performance.now();
    const state = Y.encodeStateAsUpdate(ydoc);
    documentStore.saveDocument(roomId, state);
    documentSavesTotal.inc();
    const duration = Math.round(performance.now() - start);
    logger.info(
      { roomId, event: "doc_flush", duration, bytes: state.byteLength },
      "Document state flushed on last disconnect",
    );
  },
});

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url ?? "/";
    const roomId = getRoomNameFromUrl(url);
    const log = createContextLogger({ roomId });

    // Track connection counts
    const count = incrementRoomConnection(roomId);
    activeConnections.inc();
    if (count === 1) activeRooms.inc();

    log.info({ event: "ws_connect", totalInRoom: count }, "Client connected");

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
      const remaining = decrementRoomConnection(roomId);
      activeConnections.dec();
      if (remaining === 0) {
        activeRooms.dec();
      }
      log.info({ event: "ws_disconnect", remaining }, "Client disconnected");
    });

    ws.on("error", (err) => {
      log.error({ err, event: "ws_error" }, "WebSocket error");
    });
  });
}
