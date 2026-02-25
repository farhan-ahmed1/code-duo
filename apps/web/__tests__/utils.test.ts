import { describe, it, expect } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn (class name utility)", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    // twMerge should resolve conflicting Tailwind utilities
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs via clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object inputs via clsx", () => {
    expect(cn({ hidden: true, visible: false })).toBe("hidden");
  });

  it("merges complex Tailwind classes correctly", () => {
    const result = cn(
      "text-sm font-bold",
      "text-lg", // should override text-sm
    );
    expect(result).toContain("text-lg");
    expect(result).not.toContain("text-sm");
    expect(result).toContain("font-bold");
  });
});
