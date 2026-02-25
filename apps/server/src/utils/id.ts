import { customAlphabet } from "nanoid";
import { ROOM_ID_LENGTH } from "@code-duo/shared";

// URL-safe alphabet without ambiguous characters (0, O, I, l)
const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  ROOM_ID_LENGTH,
);

/** Generate a short URL-safe room ID. */
export function generateRoomId(): string {
  return nanoid();
}
