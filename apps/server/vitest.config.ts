import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts", // Entry point with side effects
        "src/ws-server.ts", // Integration-level, tested via E2E
        "src/api/**", // Route handlers tested via E2E
        "src/jobs/**", // Cron jobs tested via integration
        "src/utils/logger.ts", // Logging config, no logic to test
        "src/utils/metrics.ts", // Prometheus setup, no logic to test
        "src/types/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 55,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@code-duo/shared": path.resolve(
        __dirname,
        "../../packages/shared/src/index.ts",
      ),
    },
  },
});
