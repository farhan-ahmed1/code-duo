import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateRoomId } from "../utils/id";
import type { Room, EditorLanguage } from "@code-duo/shared/src/types";

const DATA_DIR = process.env.DATA_DIR ?? "./data";

export class RoomStore {
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
      CREATE TABLE IF NOT EXISTS rooms (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        language    TEXT NOT NULL DEFAULT 'typescript',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        accessed_at TEXT NOT NULL
      )
    `);
  }

  /**
   * Create a new room with a short, URL-safe nanoid identifier.
   *
   * @param name     - Human-readable room name (max 100 chars).
   * @param language - Initial editor language for the room.
   * @returns The newly created room.
   */
  createRoom(name: string, language: EditorLanguage): Room {
    const id = generateRoomId();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO rooms (id, name, language, created_at, updated_at, accessed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(id, name, language, now, now, now);
    return this.getRoom(id)!;
  }

  /**
   * Fetch a single room by ID.
   *
   * @param id - The room ID to look up.
   * @returns The room, or `null` if it does not exist.
   */
  getRoom(id: string): Room | null {
    const row = this.db.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as
      | DbRoom
      | undefined;
    return row ? toRoom(row) : null;
  }

  /**
   * List rooms ordered by creation date (newest first).
   *
   * @param limit  - Maximum number of rooms to return (capped at 100 by the API layer).
   * @param offset - Number of rooms to skip for pagination.
   * @returns An array of room objects.
   */
  listRooms(limit: number, offset: number): Room[] {
    const rows = this.db
      .prepare("SELECT * FROM rooms ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset) as DbRoom[];
    return rows.map(toRoom);
  }

  /**
   * Partially update a room's mutable fields.
   *
   * @param id      - The room to update.
   * @param updates - Fields to update (`name`, `language`, or both).
   * @returns The updated room, or `null` if the room does not exist.
   */
  updateRoom(
    id: string,
    updates: Partial<Pick<Room, "name" | "language">>,
  ): Room | null {
    const now = new Date().toISOString();
    if (updates.name) {
      this.db
        .prepare("UPDATE rooms SET name = ?, updated_at = ? WHERE id = ?")
        .run(updates.name, now, id);
    }
    if (updates.language) {
      this.db
        .prepare("UPDATE rooms SET language = ?, updated_at = ? WHERE id = ?")
        .run(updates.language, now, id);
    }
    return this.getRoom(id);
  }

  /**
   * Permanently delete a room.
   * No-op if the room does not exist.
   *
   * @param id - The room ID to delete.
   */
  deleteRoom(id: string): void {
    this.db.prepare("DELETE FROM rooms WHERE id = ?").run(id);
  }

  /**
   * Update a room's `accessed_at` timestamp to the current time.
   * Called on every WebSocket connection to keep active rooms alive.
   *
   * @param id - The room ID to touch.
   */
  touchRoom(id: string): void {
    this.db
      .prepare("UPDATE rooms SET accessed_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
  }

  /**
   * Return IDs of rooms not accessed in the past N days.
   * Useful for coordinating document cleanup before purging rows.
   */
  getStaleRoomIds(olderThanDays: number): string[] {
    const cutoff = new Date(
      Date.now() - olderThanDays * 86_400_000,
    ).toISOString();
    const rows = this.db
      .prepare("SELECT id FROM rooms WHERE accessed_at < ?")
      .all(cutoff) as { id: string }[];
    return rows.map((r) => r.id);
  }

  /** Delete rooms not accessed in the past N days */
  purgeStaleRooms(olderThanDays: number): number {
    const cutoff = new Date(
      Date.now() - olderThanDays * 86_400_000,
    ).toISOString();
    const result = this.db
      .prepare("DELETE FROM rooms WHERE accessed_at < ?")
      .run(cutoff);
    return result.changes;
  }

  close() {
    this.db.close();
  }
}

interface DbRoom {
  id: string;
  name: string;
  language: string;
  created_at: string;
  updated_at: string;
  accessed_at: string;
}

function toRoom(row: DbRoom): Room {
  return {
    id: row.id,
    name: row.name,
    language: row.language as EditorLanguage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
