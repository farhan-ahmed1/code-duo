import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? "./data";

export class DocumentStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    if (dbPath === ":memory:") {
      this.db = new Database(":memory:");
    } else {
      const dir = dbPath ? join(dbPath, "..") : DATA_DIR;
      mkdirSync(dir, { recursive: true });
      this.db = new Database(dbPath ?? join(DATA_DIR, "codeduo.db"));
      this.db.pragma("journal_mode = WAL");
    }
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        room_id    TEXT PRIMARY KEY,
        state      BLOB NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  /**
   * Persist (or replace) the encoded Yjs state for a room.
   * Uses `INSERT OR REPLACE` so callers do not need to check for existence.
   *
   * @param roomId - The room whose document should be saved.
   * @param state  - The full Yjs state vector produced by `Y.encodeStateAsUpdate`.
   */
  saveDocument(roomId: string, state: Uint8Array): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (room_id, state, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(roomId, Buffer.from(state), new Date().toISOString());
  }

  /**
   * Load the persisted Yjs state for a room.
   *
   * @param roomId - The room to load.
   * @returns The raw state bytes suitable for `Y.applyUpdate`, or `null`
   *   if no document has been saved for this room yet.
   */
  loadDocument(roomId: string): Uint8Array | null {
    const row = this.db
      .prepare("SELECT state FROM documents WHERE room_id = ?")
      .get(roomId) as { state: Buffer } | undefined;
    return row ? new Uint8Array(row.state) : null;
  }

  /**
   * Remove a room's document from storage.
   * No-op if the room has no persisted document.
   *
   * @param roomId - The room to delete.
   */
  deleteDocument(roomId: string): void {
    this.db.prepare("DELETE FROM documents WHERE room_id = ?").run(roomId);
  }

  close() {
    this.db.close();
  }
}
