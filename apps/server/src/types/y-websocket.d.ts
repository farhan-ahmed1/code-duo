import * as Y from 'yjs';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';

declare module 'y-websocket/bin/utils' {
  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options?: {
      docName?: string;
      gc?: boolean;
    },
  ): void;

  export function setPersistence(persistence: {
    bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  }): void;

  export function getPersistence(): {
    bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  } | null;
}
