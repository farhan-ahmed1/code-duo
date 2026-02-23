import { USER_COLORS } from "@code-duo/shared/src/constants";

/**
 * Deterministically assign a color from the palette based on a numeric client ID.
 * Wraps around if client IDs exceed palette length.
 */
export function generateColor(clientId: number): string {
  return USER_COLORS[clientId % USER_COLORS.length]!;
}
