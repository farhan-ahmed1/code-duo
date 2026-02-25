import { describe, it, expect } from "vitest";
import { generateColor } from "../src/lib/colors";
import { USER_COLORS } from "@code-duo/shared/src/constants";

describe("generateColor", () => {
  it("returns a string from the USER_COLORS palette", () => {
    const color = generateColor("test-user");
    expect(USER_COLORS).toContain(color);
  });

  it("is deterministic — same ID always returns the same color", () => {
    const id = "user-abc123";
    const color1 = generateColor(id);
    const color2 = generateColor(id);
    const color3 = generateColor(id);
    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
  });

  it("wraps around the palette for many different IDs", () => {
    const seenColors = new Set<string>();
    // Generate more IDs than palette length to verify wrapping
    for (let i = 0; i < USER_COLORS.length * 5; i++) {
      const color = generateColor(`user-${i}`);
      seenColors.add(color);
      expect(USER_COLORS).toContain(color);
    }
    // Should use multiple colors from the palette
    expect(seenColors.size).toBeGreaterThan(1);
  });

  it("returns different colors for different IDs", () => {
    // Not guaranteed to be different for any 2 IDs, but across many IDs
    // we should see variety
    const colors = new Set<string>();
    for (let i = 0; i < 100; i++) {
      colors.add(generateColor(`distinct-user-${i}`));
    }
    expect(colors.size).toBeGreaterThan(1);
  });

  it("handles empty string", () => {
    const color = generateColor("");
    expect(USER_COLORS).toContain(color);
  });

  it("handles very long strings", () => {
    const longId = "x".repeat(10000);
    const color = generateColor(longId);
    expect(USER_COLORS).toContain(color);
  });

  it("handles special characters", () => {
    const color = generateColor("user@#$%^&*()");
    expect(USER_COLORS).toContain(color);
  });

  it("produces valid hex color strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (let i = 0; i < 50; i++) {
      const color = generateColor(`id-${i}`);
      expect(color).toMatch(hexPattern);
    }
  });
});
