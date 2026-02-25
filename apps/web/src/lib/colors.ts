import { USER_COLORS } from "@code-duo/shared";

/**
 * Simple djb2-style hash so a string ID maps to a stable number.
 * Returns a non-negative integer.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically assign a color from the palette based on a stable string ID.
 * Wraps around if IDs exceed palette length.
 */
export function generateColor(id: string): string {
  return USER_COLORS[hashCode(id) % USER_COLORS.length]!;
}
