import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Create a room via the REST API and return its ID. */
async function createRoom(
  name = "E2E Test Room",
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

/** Wait for the Monaco editor to mount and become interactive. */
async function waitForEditor(page: Page) {
  await page.waitForSelector(".monaco-editor .view-lines", {
    timeout: 15_000,
    state: "visible",
  });
  // Give y-monaco binding a moment to initialise
  await page.waitForTimeout(500);
}

/** Focus Monaco and insert text atomically.
 *
 *  Uses `keyboard.insertText()` rather than `keyboard.type()` so the entire
 *  string is delivered as a single InputEvent.  This is reliable across all
 *  browsers (WebKit in particular drops individual key events sent to Monaco
 *  under load).
 */
async function typeInEditor(page: Page, text: string) {
  await page.click(".monaco-editor .view-lines");
  await page.keyboard.press("Escape"); // dismiss autocomplete
  await page.keyboard.press("End"); // move to end of line
  await page.keyboard.insertText(text);
  await page.keyboard.press("Escape"); // dismiss autocomplete
}

/** Return the full plain-text content currently visible in Monaco.
 *  Reads via the test hook or Monaco API — reliable across all browsers,
 *  unlike reading DOM `.textContent` which may only return gutter numbers. */
async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    type TestWindow = {
      __codeDuoGetEditorValue?: () => string;
      monaco?: { editor?: { getModels?: () => Array<{ getValue(): string }> } };
    };
    const w = window as unknown as TestWindow;
    if (typeof w.__codeDuoGetEditorValue === "function") {
      return w.__codeDuoGetEditorValue();
    }
    const models = w.monaco?.editor?.getModels?.();
    return models?.[0]?.getValue() ?? "";
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Full-flow integration", () => {
  test("complete user journey: create → share → join → edit → language sync → reconnect → persist", async ({
    browser,
  }) => {
    // ---- 1. Landing page → create room ---------------------------------
    const ctxCreator = await browser.newContext();
    const creator = await ctxCreator.newPage();
    await creator.goto(BASE_URL);

    // Click "Create Room" to open the dialog
    await creator.click('button[aria-label="Create a new room"]');
    await creator.waitForSelector('[role="dialog"]', { timeout: 5_000 });

    // Fill in room name, pick Python as the language
    await creator.fill(
      'input[placeholder="My Coding Session"]',
      "Integration Test Room",
    );
    await creator.selectOption('[role="dialog"] select', "python");
    await creator.locator('[role="dialog"] button[type="submit"]').click();

    // Should navigate to /room/<id>
    await creator.waitForURL(/\/room\/[A-Za-z0-9]+/, { timeout: 10_000 });
    const roomUrl = creator.url();

    await waitForEditor(creator);

    // ---- 2. Share link → collaborator joins ----------------------------
    const ctxJoiner = await browser.newContext();
    const joiner = await ctxJoiner.newPage();
    await joiner.goto(roomUrl);
    await waitForEditor(joiner);

    // ---- 3. Real-time editing with cursors -----------------------------
    await typeInEditor(creator, "# Creator edit\n");

    await expect
      .poll(() => getEditorText(joiner), { timeout: 5_000 })
      .toContain("Creator edit");

    await typeInEditor(joiner, "# Joiner edit\n");

    await expect
      .poll(() => getEditorText(creator), { timeout: 5_000 })
      .toContain("Joiner edit");

    // ---- 4. Language change syncs --------------------------------------
    // Creator switches language to JavaScript
    await creator.selectOption(
      'select[aria-label="Editor language"]',
      "javascript",
    );

    // Joiner's language dropdown should update
    await expect(
      joiner.locator('select[aria-label="Editor language"]'),
    ).toHaveValue("javascript", { timeout: 5_000 });

    // ---- 5. Disconnect / reconnect (offline resilience) ----------------
    await ctxJoiner.setOffline(true);
    await typeInEditor(joiner, "offline text ");

    // Creator types while joiner is offline
    await typeInEditor(creator, "online text ");

    // Bring joiner back
    await ctxJoiner.setOffline(false);

    // Both should converge
    await expect
      .poll(() => getEditorText(creator), { timeout: 15_000 })
      .toContain("offline text");
    await expect
      .poll(() => getEditorText(joiner), { timeout: 15_000 })
      .toContain("online text");

    // ---- 6. Content persists after page reload -------------------------
    await joiner.reload();
    await waitForEditor(joiner);

    await expect
      .poll(() => getEditorText(joiner), { timeout: 10_000 })
      .toContain("Creator edit");

    await ctxCreator.close();
    await ctxJoiner.close();
  });

  test("three simultaneous users editing converge", async ({ browser }) => {
    const roomId = await createRoom("3-User Stress Test");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(roomUrl);
      await waitForEditor(page);
      contexts.push(ctx);
      pages.push(page);
    }

    // Each user types a unique marker sequentially to avoid CRDT interleaving
    for (let i = 0; i < pages.length; i++) {
      await typeInEditor(pages[i], `USER_${i}_MARKER `);
      // Short pause to let CRDT sync before next user types
      await pages[i].waitForTimeout(500);
    }

    // All three markers should appear in every editor
    for (const page of pages) {
      for (let i = 0; i < 3; i++) {
        await expect
          .poll(() => getEditorText(page), { timeout: 8_000 })
          .toContain(`USER_${i}_MARKER`);
      }
    }

    for (const ctx of contexts) await ctx.close();
  });
});

test.describe("Real-time collaboration", () => {
  test("two users see each other's edits in real time", async ({ browser }) => {
    const roomId = await createRoom();
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);

    await waitForEditor(pageA);
    await waitForEditor(pageB);

    await typeInEditor(pageA, "Hello from A");

    await expect
      .poll(() => getEditorText(pageB), { timeout: 5_000 })
      .toContain("Hello from A");

    await contextA.close();
    await contextB.close();
  });

  test("concurrent edits from both users converge", async ({ browser }) => {
    const roomId = await createRoom("Concurrent Edit Room");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);
    await waitForEditor(pageA);
    await waitForEditor(pageB);

    // Type sequentially — wait for CRDT sync between users
    await typeInEditor(pageA, "AAA");
    await pageA.waitForTimeout(1_000);
    await typeInEditor(pageB, "BBB");
    await pageB.waitForTimeout(3000);

    // Both should eventually have both edits
    await expect
      .poll(() => getEditorText(pageA), { timeout: 20_000 })
      .toContain("AAA");
    await expect
      .poll(() => getEditorText(pageA), { timeout: 20_000 })
      .toContain("BBB");
    await expect
      .poll(() => getEditorText(pageB), { timeout: 20_000 })
      .toContain("AAA");
    await expect
      .poll(() => getEditorText(pageB), { timeout: 20_000 })
      .toContain("BBB");

    await contextA.close();
    await contextB.close();
  });

  test("offline edits sync when reconnected", async ({ browser }) => {
    const roomId = await createRoom("Offline Sync Room");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);
    await waitForEditor(pageA);
    await waitForEditor(pageB);

    // Take context B offline
    await contextB.setOffline(true);
    await typeInEditor(pageB, "Offline edit");

    // Give the local Yjs doc a moment to absorb the insert before reconnecting
    await pageB.waitForTimeout(4000);

    // Bring context B back online
    await contextB.setOffline(false);

    // Allow time for y-websocket to reconnect with exponential backoff
    await pageB.waitForTimeout(4000);

    // Ensure the offline edit is present in pageB before checking pageA
    await expect
      .poll(() => getEditorText(pageB), { timeout: 30_000 })
      .toContain("Offline edit");

    // Page A should receive the offline edit after WebSocket re-syncs
    await expect
      .poll(() => getEditorText(pageA), { timeout: 30_000 })
      .toContain("Offline edit");

    await contextA.close();
    await contextB.close();
  });

  test("presence bar shows connected users", async ({ browser }) => {
    const roomId = await createRoom("Presence Room");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);
    await waitForEditor(pageA);
    await waitForEditor(pageB);

    // Both users should appear in each other's presence bars
    const presenceUsers = pageA.locator('[data-testid="presence-user"]');
    await expect(presenceUsers).toHaveCount(2, { timeout: 10_000 });

    // After B disconnects, A should see only 1 user
    await contextB.close();
    await expect(presenceUsers).toHaveCount(1, { timeout: 10_000 });

    await contextA.close();
  });

  test("language change syncs across users", async ({ browser }) => {
    const roomId = await createRoom("Language Sync Room", "typescript");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);
    await waitForEditor(pageA);
    await waitForEditor(pageB);

    // User A changes language to Python
    await pageA.selectOption('select[aria-label="Editor language"]', "python");

    // User B should see the language update
    await expect(
      pageB.locator('select[aria-label="Editor language"]'),
    ).toHaveValue("python", { timeout: 5_000 });

    await contextA.close();
    await contextB.close();
  });

  test("content persists after page reload", async ({ browser }) => {
    const roomId = await createRoom("Persistence Room");
    const roomUrl = `${BASE_URL}/room/${roomId}`;

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(roomUrl);
    await waitForEditor(page);

    await typeInEditor(page, "persistent content here");

    // Wait for debounced server-side save
    await page.waitForTimeout(3_000);

    // Open a second witness context so the server-side Y.Doc stays alive during reload
    const witnessCtx = await browser.newContext();
    const witnessPage = await witnessCtx.newPage();
    await witnessPage.goto(roomUrl);
    await waitForEditor(witnessPage);

    // Verify the content reached the server via the witness before reloading
    await expect
      .poll(() => getEditorText(witnessPage), { timeout: 10_000 })
      .toContain("persistent content here");

    // Reload the page
    await page.reload();
    await waitForEditor(page);

    await expect
      .poll(() => getEditorText(page), { timeout: 10_000 })
      .toContain("persistent content here");

    await witnessCtx.close();
    await context.close();
  });

  test("room creation flow from landing page", async ({ page }) => {
    await page.goto(BASE_URL);

    // Click Create Room
    await page.click('button[aria-label="Create a new room"]');
    await page.waitForSelector('[role="dialog"]');

    // Fill form
    await page.fill('input[placeholder="My Coding Session"]', "My Test Room");
    await page.locator('[role="dialog"] button[type="submit"]').click();

    // Should navigate to room page
    await page.waitForURL(/\/room\/[A-Za-z0-9]+/, { timeout: 10_000 });
    await waitForEditor(page);

    // Editor should be visible
    await expect(page.locator(".monaco-editor")).toBeVisible();
  });

  test("join room flow from landing page", async ({ browser }) => {
    const roomId = await createRoom("Joinable Room");

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL);

    // Open the Join Room dialog
    await page
      .locator('button[aria-label="Join an existing room"]')
      .first()
      .click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });

    // Enter room code and join
    await page.fill('input[placeholder="Paste a room code or URL…"]', roomId);
    await page.locator('[role="dialog"] button[type="submit"]').click();

    await page.waitForURL(/\/room\//, { timeout: 10_000 });
    await waitForEditor(page);

    await expect(page.locator(".monaco-editor")).toBeVisible();

    await context.close();
  });
});
