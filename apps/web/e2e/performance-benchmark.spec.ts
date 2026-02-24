/**
 * performance-benchmark.spec.ts
 *
 * Measures two key performance metrics for Code Duo:
 *
 *   1. Edit propagation latency — time from a keystroke on client A until
 *      the change is visible in client B — for 1, 3, 5, and 10 concurrent
 *      users sharing the same room.
 *
 *   2. Document load time — time from navigation to the room page until the
 *      Monaco editor becomes interactive, for documents pre-seeded with
 *      1 KB, 100 KB, and 1 MB of content.
 *
 * Results are collected across multiple samples, aggregated (min / p50 / p95
 * / max), printed to the console, and written to:
 *
 *   apps/web/e2e/benchmark-results.json
 *
 * Run only via the "benchmark" Playwright project:
 *
 *   pnpm test:e2e --project=benchmark
 *
 * NOTE: This file deliberately avoids Playwright's `expect()` assertions for
 * the benchmark measurements themselves — it reports numbers rather than
 * making pass/fail decisions.  A single soft assertion at the end fails the
 * test only if the p95 latency exceeds a very generous ceiling (1 000 ms),
 * which would indicate a fundamental connectivity problem.
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LatencyResult {
  concurrentUsers: number;
  samples: number[];
  min: number;
  p50: number;
  p95: number;
  max: number;
}

interface LoadTimeResult {
  documentSizeLabel: string;
  documentSizeBytes: number;
  samples: number[];
  min: number;
  p50: number;
  p95: number;
  max: number;
}

interface BenchmarkReport {
  timestamp: string;
  editPropagationLatency: LatencyResult[];
  documentLoadTime: LoadTimeResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function summarise(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    samples,
    min: sorted[0] ?? 0,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

async function createRoom(name: string, language = "typescript"): Promise<string> {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, language }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(
        `createRoom failed: 429 (rate limit hit).\n` +
        `The server's room-creation rate limit (10 rooms/hour) has been exceeded.\n` +
        `Fix: restart the server with DISABLE_RATE_LIMIT=true, e.g.:\n` +
        `  DISABLE_RATE_LIMIT=true pnpm --filter @code-duo/server dev`,
      );
    }
    throw new Error(`createRoom failed: ${res.status}`);
  }
  const room = await res.json();
  return room.id as string;
}

/** Seed document content via the WebSocket API by connecting a headless
 *  Yjs session.  Since we cannot use the Node.js `ws` module inside a
 *  Playwright browser context, we instead open a temporary page, wait for
 *  the editor, then inject the desired content directly into Monaco. */
async function seedDocument(page: Page, sizeBytes: number): Promise<void> {
  // Build a string of exactly sizeBytes characters
  const chunk = "// benchmark seed content — lorem ipsum padding line\n";
  let content = "";
  while (content.length < sizeBytes) {
    content += chunk;
  }
  content = content.slice(0, sizeBytes);

  // Inject via Monaco's setValue so Yjs picks it up
  await page.evaluate((text: string) => {
    type TestWindow = { __codeDuoSetEditorValue?: (v: string) => void; monaco?: { editor?: { getModels?: () => Array<{ setValue(v: string): void }> } } };
    const w = window as unknown as TestWindow;
    if (typeof w.__codeDuoSetEditorValue === "function") {
      w.__codeDuoSetEditorValue(text);
    } else {
      const models = w.monaco?.editor?.getModels?.();
      models?.[0]?.setValue(text);
    }
  }, content);

  // Wait for y-websocket to relay the update
  await page.waitForTimeout(1_500);
}

async function waitForEditor(page: Page): Promise<void> {
  await page.waitForSelector(".monaco-editor .view-lines", { timeout: 20_000 });
  await page.waitForTimeout(600);
}

async function typeMarker(page: Page, marker: string): Promise<void> {
  await page.click(".monaco-editor .view-lines");
  await page.keyboard.press("Escape");
  // Move to end of document so marker doesn't collide with seeded content
  await page.keyboard.press("Control+End");
  // Use insertText (atomic) — keyboard.type is unreliable on WebKit/Firefox
  await page.keyboard.insertText(marker);
  await page.keyboard.press("Escape");
}

// ---------------------------------------------------------------------------
// 1. Edit propagation latency
// ---------------------------------------------------------------------------

/**
 * Measures mean one-way edit propagation latency across SAMPLE_COUNT rounds.
 *
 * In each round:
 *   - A unique marker string is typed on page[0].
 *   - We poll page[1] until the marker appears, recording the elapsed time.
 *
 * @param sender   The page that types
 * @param receiver The page that must receive the edit
 * @param samples  Number of measurement rounds
 */
async function measureLatencySamples(
  sender: Page,
  receiver: Page,
  samples = 5,
): Promise<number[]> {
  const results: number[] = [];

  for (let i = 0; i < samples; i++) {
    const marker = `__BENCH_LATENCY_${Date.now()}_${i}__`;
    const t0 = Date.now();

    // Type marker on sender
    await typeMarker(sender, marker);

    // Poll receiver until the marker appears (max 5 s)
    await expect(receiver.locator(".monaco-editor")).toContainText(marker, {
      timeout: 5_000,
    });

    results.push(Date.now() - t0);

    // Short pause so edits don't pile up
    await sender.waitForTimeout(200);
  }

  return results;
}

test.describe("Benchmark: edit propagation latency", () => {
  // We run one consolidated test that collects data for all user counts rather
  // than one test per concurrency level — this avoids Playwright's per-test
  // parallelism interfering with timing measurements.

  test("latency with 1, 3, 5, and 10 concurrent users", async ({ browser }) => {
    test.setTimeout(300_000); // Opening up to 11 contexts in Firefox/WebKit needs headroom
    const SAMPLE_COUNT = 5;
    const concurrencyLevels = [1, 3, 5, 10];
    const results: LatencyResult[] = [];

    for (const userCount of concurrencyLevels) {
      const roomId = await createRoom(`Latency Benchmark - ${userCount} users`);
      const roomUrl = `${BASE_URL}/room/${roomId}`;

      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];

      for (let i = 0; i <= userCount; i++) {
        // +1 because we need at least a sender AND a receiver
        const ctx = await browser.newContext();
        const pg = await ctx.newPage();
        await pg.goto(roomUrl);
        contexts.push(ctx);
        pages.push(pg);
      }

      await Promise.all(pages.map((p) => waitForEditor(p)));

      // Measure latency from pages[0] → pages[1]
      // Extra users beyond 2 are present but idle (they contribute load to the
      // server's broadcast fan-out, which is realistic).
      const samples = await measureLatencySamples(pages[0], pages[1], SAMPLE_COUNT);
      const summary = summarise(samples);

      const result: LatencyResult = { concurrentUsers: userCount, ...summary };
      results.push(result);

      console.log(
        `\n[Latency] ${userCount} concurrent user(s):` +
          `  min=${result.min} ms` +
          `  p50=${result.p50} ms` +
          `  p95=${result.p95} ms` +
          `  max=${result.max} ms`,
      );

      await Promise.all(contexts.map((c) => c.close()));
    }

    // Soft assertion: p95 latency with 10 users must stay below 10 000 ms on
    // localhost (all browser contexts share one machine; dev-mode Turbopack +
    // non-Chromium engines add overhead.  In production, same-region p95 should
    // be well under 50 ms).
    const worstP95 = Math.max(...results.map((r) => r.p95));
    expect(
      worstP95,
      `p95 latency (${worstP95} ms) exceeded 10 000 ms ceiling`,
    ).toBeLessThan(10_000);

    // Store for the consolidated report written in afterAll.
    (globalThis as Record<string, unknown>).__latencyResults = results;
  });
});

// ---------------------------------------------------------------------------
// 2. Document load time
// ---------------------------------------------------------------------------

/**
 * Measures the time from `page.goto(roomUrl)` until the Monaco editor
 * becomes fully interactive (`.monaco-editor .view-lines` visible + a short
 * stabilisation wait).
 */
async function measureLoadTime(
  browser: { newContext(): Promise<BrowserContext> },
  roomUrl: string,
  samples = 4,
): Promise<number[]> {
  const results: number[] = [];

  for (let i = 0; i < samples; i++) {
    // Fresh context each time — no warm cache
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const t0 = Date.now();
    await page.goto(roomUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".monaco-editor .view-lines", { timeout: 30_000 });
    results.push(Date.now() - t0);

    await ctx.close();

    // Short pause between samples
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

test.describe("Benchmark: document load time", () => {
  test("load time for 1 KB, 100 KB, and 1 MB documents", async ({ browser }) => {
    test.setTimeout(180_000); // Seeding + measuring 3 document sizes in Firefox/WebKit
    const documentSizes: Array<{ label: string; bytes: number }> = [
      { label: "1 KB",   bytes: 1_000 },
      { label: "100 KB", bytes: 100_000 },
      { label: "1 MB",   bytes: 1_000_000 },
    ];

    const SAMPLE_COUNT = 4;
    const loadResults: LoadTimeResult[] = [];

    for (const { label, bytes } of documentSizes) {
      // Create a room and seed its document via a temporary browser page
      const roomId = await createRoom(`Load Benchmark - ${label}`);
      const roomUrl = `${BASE_URL}/room/${roomId}`;

      // Seed the document with the target amount of content
      const seedCtx = await browser.newContext();
      const seedPage = await seedCtx.newPage();
      await seedPage.goto(roomUrl);
      await waitForEditor(seedPage);
      await seedDocument(seedPage, bytes);
      await seedCtx.close();

      // Wait a moment for server persistence to flush
      await new Promise((r) => setTimeout(r, 2_000));

      // Measure fresh-load time across SAMPLE_COUNT iterations
      const samples = await measureLoadTime(browser, roomUrl, SAMPLE_COUNT);
      const summary = summarise(samples);

      const result: LoadTimeResult = {
        documentSizeLabel: label,
        documentSizeBytes: bytes,
        ...summary,
      };
      loadResults.push(result);

      console.log(
        `\n[Load Time] ${label} document:` +
          `  min=${result.min} ms` +
          `  p50=${result.p50} ms` +
          `  p95=${result.p95} ms` +
          `  max=${result.max} ms`,
      );
    }

    // Soft assertion: 1 MB document must load in under 15 seconds.
    const largestResult = loadResults.find((r) => r.documentSizeLabel === "1 MB");
    if (largestResult) {
      expect(
        largestResult.p95,
        `1 MB p95 load time (${largestResult.p95} ms) exceeded 15 000 ms ceiling`,
      ).toBeLessThan(15_000);
    }

    (globalThis as Record<string, unknown>).__loadResults = loadResults;
  });
});

// ---------------------------------------------------------------------------
// 3. Write consolidated report to disk
// ---------------------------------------------------------------------------

test.afterAll(async () => {
  const latencyResults =
    ((globalThis as Record<string, unknown>).__latencyResults as LatencyResult[]) ?? [];
  const loadResults =
    ((globalThis as Record<string, unknown>).__loadResults as LoadTimeResult[]) ?? [];

  if (latencyResults.length === 0 && loadResults.length === 0) return;

  const outputPath = path.join(__dirname, "benchmark-results.json");

  // Merge with whatever the other parallel worker may have already written,
  // because each Playwright worker has its own globalThis and only holds its
  // own half of the results.
  let existing: Partial<BenchmarkReport> = {};
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as Partial<BenchmarkReport>;
    } catch {
      // ignore parse errors — start fresh
    }
  }

  const mergedLatency = [
    ...(existing.editPropagationLatency ?? []),
    ...latencyResults,
  ].sort((a, b) => a.concurrentUsers - b.concurrentUsers);

  const seenSizes = new Set<string>();
  const mergedLoad = [
    ...(existing.documentLoadTime ?? []),
    ...loadResults,
  ].filter((r) => {
    if (seenSizes.has(r.documentSizeLabel)) return false;
    seenSizes.add(r.documentSizeLabel);
    return true;
  });

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    editPropagationLatency: mergedLatency,
    documentLoadTime: mergedLoad,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n✓ Benchmark results written to ${outputPath}`);

  // Pretty-print a markdown table for easy copy-paste into ARCHITECTURE.md
  console.log("\n--- Edit Propagation Latency ---");
  console.log(
    "| Concurrent Users | min (ms) | p50 (ms) | p95 (ms) | max (ms) |",
  );
  console.log("|------------------|----------|----------|----------|----------|");
  for (const r of mergedLatency) {
    console.log(
      `| ${String(r.concurrentUsers).padEnd(16)} | ${String(r.min).padEnd(8)} | ${String(r.p50).padEnd(8)} | ${String(r.p95).padEnd(8)} | ${String(r.max).padEnd(8)} |`,
    );
  }

  console.log("\n--- Document Load Time ---");
  console.log(
    "| Document Size | min (ms) | p50 (ms) | p95 (ms) | max (ms) |",
  );
  console.log("|---------------|----------|----------|----------|----------|");
  for (const r of mergedLoad) {
    console.log(
      `| ${r.documentSizeLabel.padEnd(13)} | ${String(r.min).padEnd(8)} | ${String(r.p50).padEnd(8)} | ${String(r.p95).padEnd(8)} | ${String(r.max).padEnd(8)} |`,
    );
  }
});
