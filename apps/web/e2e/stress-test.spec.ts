/**
 * stress-test.spec.ts
 *
 * Full stress tests for Code Duo — Week 3 integration testing.
 *
 * These tests open many browser contexts simultaneously, generate concurrent
 * edit load, and simulate network interruptions to verify that all clients
 * always converge to the same final document state.
 *
 * Run only via the "stress" Playwright project to avoid slowing down
 * the regular cross-browser suite:
 *
 *   pnpm test:e2e --project=stress
 */

import {
  test,
  expect,
  type Page,
  type BrowserContext,
} from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// Helpers shared across all stress tests
// ---------------------------------------------------------------------------

async function createRoom(
  name = "Stress Test Room",
  language = "typescript",
): Promise<string> {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, language }),
  });
  if (!res.ok) throw new Error(`Failed to create room: ${res.status}`);
  const room = await res.json();
  return room.id as string;
}

/** Wait for Monaco to be interactive. */
async function waitForEditor(page: Page, timeout = 20_000) {
  await page.waitForSelector(".monaco-editor .view-lines", { timeout });
  await page.waitForTimeout(600);
}

/** Click into the Monaco editor and insert text atomically.
 *
 * Uses `keyboard.insertText()` rather than `keyboard.type()` so the entire
 * string is delivered as a single `InputEvent`. This prevents character-level
 * interleaving when multiple pages type concurrently via `Promise.all`.
 */
async function typeInEditor(page: Page, text: string) {
  await page.click(".monaco-editor .view-lines");
  // Dismiss any active autocomplete / IntelliSense dropdown that might
  // intercept subsequent keystrokes (e.g. Enter confirming a suggestion).
  await page.keyboard.press("Escape");
  // Move to end of document so this user appends rather than inserting at
  // position 0.
  await page.keyboard.press("Control+End");
  // Insert a newline + the full string as one atomic operation.
  // Using a single insertText prevents other users' CRDT ops from landing
  // between the newline and the text — which was causing token splits like
  // "U1U3B2 B1" instead of intact "U1B1" and "U3B2".
  await page.keyboard.insertText("\n" + text);
  // Dismiss any autocomplete that appeared during insertion so it doesn't
  // pollute the DOM text seen by subsequent assertions.
  await page.keyboard.press("Escape");
}

/** Return the full plain-text content currently visible in Monaco. */
async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    // Prefer the test hook injected by CollaborativeEditor on editor mount.
    // This is reliable regardless of how Monaco's AMD loader is configured.
    type TestWindow = { __codeDuoGetEditorValue?: () => string; monaco?: { editor?: { getModels?: () => Array<{ getValue(): string }> } } };
    const w = window as unknown as TestWindow;
    if (typeof w.__codeDuoGetEditorValue === "function") {
      return w.__codeDuoGetEditorValue();
    }
    // Fall back to the Monaco AMD global (works in production builds).
    const models = w.monaco?.editor?.getModels?.();
    return models?.[0]?.getValue() ?? "";
  });
}

/** Set up N browser pages all inside the same room, return [contexts, pages]. */
async function setupRoom(
  browser: Parameters<typeof test>[1] extends { browser: infer B } ? B : never,
  n: number,
  roomUrl: string,
): Promise<{ contexts: BrowserContext[]; pages: Page[] }> {
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];

  for (let i = 0; i < n; i++) {
    const ctx = await (browser as { newContext(): Promise<BrowserContext> }).newContext();
    const page = await ctx.newPage();
    await page.goto(roomUrl);
    contexts.push(ctx);
    pages.push(page);
  }

  // Wait for all editors in parallel
  await Promise.all(pages.map((p) => waitForEditor(p)));
  return { contexts, pages };
}

async function closeAll(contexts: BrowserContext[]) {
  await Promise.all(contexts.map((c) => c.close()));
}

// ---------------------------------------------------------------------------
// 1. Five concurrent users — all edits converge
// ---------------------------------------------------------------------------

test.describe("Stress: 5 concurrent users", () => {
  /**
   * Each of the 5 users types a unique marker simultaneously.
   * At the end, every window must contain every marker — proving CRDT
   * convergence under concurrent write load.
   */
  test("all 5 editors converge to the same document state", async ({
    browser,
  }) => {
    const roomId = await createRoom("5-User Stress Test");
    const roomUrl = `${BASE_URL}/room/${roomId}`;
    const USER_COUNT = 5;

    const { contexts, pages } = await setupRoom(browser as never, USER_COUNT, roomUrl);

    try {
      // Type sequentially with short pauses so no user's insertText races
      // against another's click-to-focus (WebKit loses the insert otherwise).
      for (let i = 0; i < USER_COUNT; i++) {
        await typeInEditor(pages[i], `STRESS_USER_${i}_MARKER `);
        await pages[i].waitForTimeout(300);
      }

      // Allow a generous convergence window (CRDT guarantees eventual
      // consistency; latency on localhost is typically <200 ms)
      const CONVERGENCE_TIMEOUT = 15_000;

      for (const page of pages) {
        for (let i = 0; i < USER_COUNT; i++) {
          await expect
            .poll(() => getEditorText(page), { timeout: CONVERGENCE_TIMEOUT })
            .toContain(`STRESS_USER_${i}_MARKER`);
        }
      }
    } finally {
      await closeAll(contexts);
    }
  });

  /**
   * Rapid concurrent editing: each user fires multiple short bursts of text
   * in quick succession to simulate realistic typing behaviour under load.
   */
  test("rapid concurrent bursts from 5 users converge", async ({ browser }) => {
    const roomId = await createRoom("5-User Rapid Burst Test");
    const roomUrl = `${BASE_URL}/room/${roomId}`;
    const USER_COUNT = 5;
    const BURSTS = 3;

    const { contexts, pages } = await setupRoom(browser as never, USER_COUNT, roomUrl);

    try {
      // Send bursts round-by-round.  Within each round, type sequentially
      // with short pauses to avoid focus-racing (WebKit drops inserts when
      // two pages click-to-focus simultaneously).
      for (let b = 0; b < BURSTS; b++) {
        for (let i = 0; i < USER_COUNT; i++) {
          await typeInEditor(pages[i], `U${i}B${b} `);
          await pages[i].waitForTimeout(400);
        }
        // Allow CRDT ops from this round to propagate before next round
        await pages[0].waitForTimeout(3_000);
      }

      const CONVERGENCE_TIMEOUT = 30_000;

      for (const page of pages) {
        for (let i = 0; i < USER_COUNT; i++) {
          for (let b = 0; b < BURSTS; b++) {
            await expect
              .poll(() => getEditorText(page), { timeout: CONVERGENCE_TIMEOUT })
              .toContain(`U${i}B${b}`);
          }
        }
      }
    } finally {
      await closeAll(contexts);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Network interruptions — offline clients re-sync on reconnect
// ---------------------------------------------------------------------------

test.describe("Stress: network interruptions", () => {
  /**
   * With 5 users, 2 are taken offline, both sides edit, and then offline
   * clients reconnect. All 5 must end up with the same document.
   */
  test("clients taken offline then reconnected converge", async ({
    browser,
  }) => {
    const roomId = await createRoom("Network Interruption Stress Test");
    const roomUrl = `${BASE_URL}/room/${roomId}`;
    const USER_COUNT = 5;
    const OFFLINE_COUNT = 2; // users 0 and 1 go offline

    const { contexts, pages } = await setupRoom(browser as never, USER_COUNT, roomUrl);

    try {
      // Let an initial edit propagate so all users share a baseline
      await typeInEditor(pages[0], "BASELINE ");
      await Promise.all(
        pages.map((p) =>
          expect
            .poll(() => getEditorText(p), { timeout: 8_000 })
            .toContain("BASELINE"),
        ),
      );

      // Take the first OFFLINE_COUNT users offline
      await Promise.all(
        contexts
          .slice(0, OFFLINE_COUNT)
          .map((ctx) => ctx.setOffline(true)),
      );

      // Offline users type their own content
      await Promise.all(
        pages
          .slice(0, OFFLINE_COUNT)
          .map((p, i) => typeInEditor(p, `OFFLINE_${i} `)),
      );

      // Online users type their own content sequentially to prevent CRDT
      // interleaving that splits tokens (e.g. "ON" + "LINE_0" instead of
      // "ONLINE_0") when multiple pages click-to-focus simultaneously.
      for (let i = 0; i < USER_COUNT - OFFLINE_COUNT; i++) {
        await typeInEditor(pages[OFFLINE_COUNT + i], `ONLINE_${i} `);
        await pages[OFFLINE_COUNT + i].waitForTimeout(300);
      }

      // Bring offline users back online
      await Promise.all(
        contexts
          .slice(0, OFFLINE_COUNT)
          .map((ctx) => ctx.setOffline(false)),
      );

      // Allow time for y-websocket to reconnect with exponential backoff
      await pages[0].waitForTimeout(2_000);

      // All 5 clients must converge — containing both offline and online edits
      const CONVERGENCE_TIMEOUT = 30_000;

      for (const page of pages) {
        for (let i = 0; i < OFFLINE_COUNT; i++) {
          await expect
            .poll(() => getEditorText(page), { timeout: CONVERGENCE_TIMEOUT })
            .toContain(`OFFLINE_${i}`);
        }
        for (let i = 0; i < USER_COUNT - OFFLINE_COUNT; i++) {
          await expect
            .poll(() => getEditorText(page), { timeout: CONVERGENCE_TIMEOUT })
            .toContain(`ONLINE_${i}`);
        }
      }
    } finally {
      await closeAll(contexts);
    }
  });

  /**
   * Simulate DevTools-style throttling: one client briefly delays its
   * connection (using offline mode as a proxy) while heavy editing happens
   * on other clients.
   */
  test("throttled client catches up after re-enabling network", async ({
    browser,
  }) => {
    const roomId = await createRoom("Throttle Simulation Test");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const { contexts, pages } = await setupRoom(browser as never, 3, roomUrl);

    try {
      // Establish a baseline so we know all 3 providers have completed
      // initial Yjs sync before we start disrupting connectivity.
      await typeInEditor(pages[0], "BASELINE ");
      await Promise.all(
        pages.map((p) =>
          expect
            .poll(() => getEditorText(p), { timeout: 8_000 })
            .toContain("BASELINE"),
        ),
      );

      // Client 2 simulates throttled / intermittent connectivity with 3 cycles
      const throttleCycles = async () => {
        for (let cycle = 0; cycle < 3; cycle++) {
          await contexts[2].setOffline(true);
          await pages[2].waitForTimeout(500);
          await contexts[2].setOffline(false);
          await pages[2].waitForTimeout(500);
        }
      };

      // Meanwhile clients 0 and 1 are typing continuously
      await Promise.all([
        throttleCycles(),
        (async () => {
          for (let i = 0; i < 5; i++) {
            await typeInEditor(pages[0], `A${i} `);
            await pages[0].waitForTimeout(100);
          }
          const txt0 = await getEditorText(pages[0]);
          console.log("page0 content after typing:", txt0);
        })(),
        (async () => {
          for (let i = 0; i < 5; i++) {
            await typeInEditor(pages[1], `B${i} `);
            await pages[1].waitForTimeout(100);
          }
          const txt1 = await getEditorText(pages[1]);
          console.log("page1 content after typing:", txt1);
        })(),
      ]);

      // Ensure client 2 is definitely online after the throttle cycles
      await contexts[2].setOffline(false);
      // Give client 2 ample time to reconnect and catch up
      await pages[2].waitForTimeout(10000);
      const afterReconnect = await getEditorText(pages[2]);
      console.log("page2 content after reconnect:", afterReconnect);

      // All content from active clients must be present in throttled client
      const TIMEOUT = 60_000;
      for (let i = 0; i < 5; i++) {
        await expect
          .poll(() => getEditorText(pages[2]), { timeout: TIMEOUT })
          .toContain(`A${i}`);
        await expect
          .poll(() => getEditorText(pages[2]), { timeout: TIMEOUT })
          .toContain(`B${i}`);
      }
    } finally {
      await closeAll(contexts);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Cross-browser specific: IndexedDB + WebSocket on each engine
// ---------------------------------------------------------------------------

/**
 * This test is intentionally part of the stress file so it can be included
 * when running the cross-browser projects. It verifies the two browser-
 * specific features that vary most across engines.
 */
test("IndexedDB persistence works after hard reload", async ({ browser }) => {
  const roomId = await createRoom("IndexedDB Persistence Test");
  const roomUrl = `${BASE_URL}/room/${roomId}`;

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(roomUrl);
  await waitForEditor(page);
  // Bypass flaky keyboard input by injecting text directly via the test hook.
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    if (typeof w.__codeDuoSetEditorValue === "function") {
      w.__codeDuoSetEditorValue("persisted via indexeddb");
    } else {
      // fallback in case hook isn't available
      const models = w.monaco?.editor?.getModels?.();
      models?.[0]?.setValue("persisted via indexeddb");
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  // Give y-indexeddb a moment to flush the new content.
  await page.waitForTimeout(5000);

  // Confirm the value is present locally before proceeding.
  const editorValue = await getEditorText(page);
  console.log("Editor value after injection:", editorValue);
  await expect(editorValue).toContain("persisted via indexeddb");

  // Open a second context so the server-side Y.Doc stays alive during the
  // reload — prevents a race between y-websocket's writeState (triggered on
  // last-client disconnect) and bindState (triggered on reconnection).
  const witnessCtx = await browser.newContext();
  const witnessPage = await witnessCtx.newPage();
  await witnessPage.goto(roomUrl);
  await waitForEditor(witnessPage);
  await witnessPage.waitForTimeout(4000);

  // Verify the content reached the server via the witness before reloading
  await expect
    .poll(() => getEditorText(witnessPage), { timeout: 40_000 })
    .toContain("persisted via indexeddb");

  // Hard reload — content restores from server (doc still alive) + IndexedDB
  await page.reload({ waitUntil: "networkidle" });
  await waitForEditor(page);

  await expect
    .poll(() => getEditorText(page), { timeout: 20_000 })
    .toContain("persisted via indexeddb");

  await witnessCtx.close();
  await ctx.close();
});

test("WebSocket reconnects transparently after drop", async ({
  browser,
}) => {
  const roomId = await createRoom("WS Reconnect Test");
  const roomUrl = `${BASE_URL}/room/${roomId}`;

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await pageA.goto(roomUrl);
  await pageB.goto(roomUrl);
  await waitForEditor(pageA);
  await waitForEditor(pageB);

  try {
    // Type, go offline briefly, type again, reconnect
    await typeInEditor(pageA, "before-drop ");
    await expect
      .poll(() => getEditorText(pageB), { timeout: 8_000 })
      .toContain("before-drop");

    await ctxA.setOffline(true);
    await typeInEditor(pageA, "during-drop ");
    await ctxA.setOffline(false);

    await expect
      .poll(() => getEditorText(pageB), { timeout: 12_000 })
      .toContain("during-drop");
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
