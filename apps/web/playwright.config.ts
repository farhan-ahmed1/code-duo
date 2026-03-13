import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Code Duo.
 *
 * Runs the full E2E suite across Chrome (Chromium), Firefox, and Safari
 * (WebKit) to cover cross-browser requirements.
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL  – frontend URL (default: http://localhost:3000)
 *   API_URL              – backend URL  (default: http://localhost:4000)
 *   CI                   – set by GitHub Actions; enables retries and sharding
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const USE_MANAGED_WEB_SERVER =
  !process.env.SKIP_PLAYWRIGHT_WEBSERVER && BASE_URL.includes("localhost");
const VERCEL_AUTOMATION_BYPASS_SECRET =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  /* Run each test up to 60 s before timing out */
  timeout: 60_000,
  /* Global test expectation timeout */
  expect: { timeout: 10_000 },

  /* Retry flaky tests once on CI, never locally */
  retries: process.env.CI ? 1 : 0,

  /* Sequential inside a single file but parallel across files */
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  /* Reporter: list in dev, HTML + dot on CI */
  reporter: process.env.CI
    ? [["dot"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],

  /* Shared settings for all projects */
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "true",
        }
      : undefined,
    /* Capture trace on first retry for debugging */
    trace: "on-first-retry",
    /* Record video for failed tests */
    video: "retain-on-failure",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
  },

  projects: [
    // ── Desktop browsers ───────────────────────────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [
        /performance-benchmark\.spec\.ts/,
        /stress-test\.spec\.ts/,
        /deployed-smoke\.spec\.ts/,
      ],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: [
        /performance-benchmark\.spec\.ts/,
        /stress-test\.spec\.ts/,
        /deployed-smoke\.spec\.ts/,
      ],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: [
        /performance-benchmark\.spec\.ts/,
        /stress-test\.spec\.ts/,
        /deployed-smoke\.spec\.ts/,
      ],
    },

    // ── Opt-in test projects ───────────────────────────────────────────────
    {
      name: "deployed",
      testMatch: /deployed-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "stress",
      testMatch: /stress-test\.spec\.ts/,
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "benchmark",
      testMatch: /performance-benchmark\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start frontend + backend dev servers automatically when not already up.
   * Set reuseExistingServer: true so running `pnpm dev` manually first is
   * also supported — Playwright will attach to the already-running process. */
  webServer: USE_MANAGED_WEB_SERVER
    ? [
        {
          command: "DISABLE_RATE_LIMIT=true pnpm --filter @code-duo/server dev",
          url: "http://localhost:4000/api/health",
          reuseExistingServer: true,
          timeout: 60_000,
          env: { DISABLE_RATE_LIMIT: "true" },
        },
        {
          command: "pnpm --filter @code-duo/web dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ]
    : undefined,
});
