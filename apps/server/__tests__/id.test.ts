import { describe, it, expect } from "vitest";
import { generateRoomId } from "../src/utils/id.js";
import { ROOM_ID_LENGTH } from "@code-duo/shared";

describe("generateRoomId", () => {
  it("generates an ID of the correct length", () => {
    const id = generateRoomId();
    expect(id).toHaveLength(ROOM_ID_LENGTH);
  });

  it("generates URL-safe characters only", () => {
    // The custom alphabet excludes ambiguous chars (0, O, I, l)
    const urlSafe = /^[A-Za-z0-9]+$/;
    for (let i = 0; i < 100; i++) {
      const id = generateRoomId();
      expect(id).toMatch(urlSafe);
    }
  });

  it("does not contain ambiguous characters (0, O, I, l)", () => {
    const ambiguous = /[0OIl]/;
    for (let i = 0; i < 100; i++) {
      const id = generateRoomId();
      expect(id).not.toMatch(ambiguous);
    }
  });

  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateRoomId());
    }
    expect(ids.size).toBe(1000);
  });

  it("returns a string type", () => {
    expect(typeof generateRoomId()).toBe("string");
  });
});
