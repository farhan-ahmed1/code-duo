import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? './data';

export class DocumentStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    if (dbPath === ':memory:') {
      this.db = new Database(':memory:');
    } else {
      const dir = dbPath ? join(dbPath, '..') : DATA_DIR;
      mkdirSync(dir, { recursive: true });
      this.db = new Database(dbPath ?? join(DATA_DIR, 'codeduo.db'));
      this.db.pragma('journal_mode = WAL');
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

  saveDocument(roomId: string, state: Uint8Array): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (room_id, state, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(roomId, Buffer.from(state), new Date().toISOString());
  }

  loadDocument(roomId: string): Uint8Array | null {
    const row = this.db
      .prepare('SELECT state FROM documents WHERE room_id = ?')
      .get(roomId) as { state: Buffer } | undefined;
    return row ? new Uint8Array(row.state) : null;
  }

  deleteDocument(roomId: string): void {
    this.db.prepare('DELETE FROM documents WHERE room_id = ?').run(roomId);
  }

  close() {
    this.db.close();
  }
}
