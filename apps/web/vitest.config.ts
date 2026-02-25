import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
      ],
      exclude: [
        "src/hooks/useYjs.ts",              // Heavy external deps (y-websocket, y-indexeddb)
        "src/hooks/useRoom.ts",
        "src/hooks/useAwareness.ts",
        "src/hooks/useKeyboardShortcuts.ts",
        "src/hooks/usePerformanceMetrics.ts",
        "src/lib/config.ts",                // Env var defaults, no logic
        "src/lib/yjs.ts",                   // Browser-only Yjs setup
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@/*": path.resolve(__dirname, "src"),
      "@code-duo/shared/src/constants": path.resolve(
        __dirname,
        "../../packages/shared/src/constants.ts",
      ),
      "@code-duo/shared/src/types": path.resolve(
        __dirname,
        "../../packages/shared/src/types.ts",
      ),
      "@code-duo/shared": path.resolve(
        __dirname,
        "../../packages/shared/src/index.ts",
      ),
    },
  },
});
