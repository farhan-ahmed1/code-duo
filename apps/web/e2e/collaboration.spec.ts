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
  const room = await res.json();
  return room.id as string;
}

/** Wait for the Monaco editor to mount and become interactive. */
async function waitForEditor(page: Page) {
  await page.waitForSelector(".monaco-editor .view-lines", { timeout: 15_000 });
  // Give y-monaco binding a moment to initialise
  await page.waitForTimeout(500);
}

/** Focus Monaco and type text. */
async function typeInEditor(page: Page, text: string) {
  await page.click(".monaco-editor .view-lines");
  await page.keyboard.type(text, { delay: 20 });
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
    await creator.click('button:has-text("Create Room")');
    await creator.waitForSelector('[role="dialog"]', { timeout: 5_000 });

    // Fill in room name, pick Python as the language
    await creator.fill('input[placeholder="My Coding Session"]', "Integration Test Room");
    await creator.selectOption("select", "python");
    await creator.click('button:has-text("Create Room")');

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

    await expect(joiner.locator(".monaco-editor")).toContainText(
      "Creator edit",
      { timeout: 5_000 },
    );

    await typeInEditor(joiner, "# Joiner edit\n");

    await expect(creator.locator(".monaco-editor")).toContainText(
      "Joiner edit",
      { timeout: 5_000 },
    );

    // ---- 4. Language change syncs --------------------------------------
    // Creator switches language to JavaScript
    await creator.selectOption('select[aria-label="Editor language"]', "javascript");

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
    await expect(creator.locator(".monaco-editor")).toContainText(
      "offline text",
      { timeout: 10_000 },
    );
    await expect(joiner.locator(".monaco-editor")).toContainText(
      "online text",
      { timeout: 10_000 },
    );

    // ---- 6. Content persists after page reload -------------------------
    await joiner.reload();
    await waitForEditor(joiner);

    await expect(joiner.locator(".monaco-editor")).toContainText(
      "Creator edit",
      { timeout: 10_000 },
    );

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

    // Each user types a unique marker
    await Promise.all(
      pages.map((p, i) => typeInEditor(p, `USER_${i}_MARKER `)),
    );

    // All three markers should appear in every editor
    for (const page of pages) {
      for (let i = 0; i < 3; i++) {
        await expect(page.locator(".monaco-editor")).toContainText(
          `USER_${i}_MARKER`,
          { timeout: 8_000 },
        );
      }
    }

    for (const ctx of contexts) await ctx.close();
  });
});

test.describe("Real-time collaboration", () => {
  test("two users see each other's edits in real time", async ({
    browser,
  }) => {
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

    await expect(pageB.locator(".monaco-editor")).toContainText(
      "Hello from A",
      { timeout: 5_000 },
    );

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

    await Promise.all([
      typeInEditor(pageA, "AAA"),
      typeInEditor(pageB, "BBB"),
    ]);

    // Both should eventually have both edits
    await expect(pageA.locator(".monaco-editor")).toContainText("AAA", {
      timeout: 5_000,
    });
    await expect(pageA.locator(".monaco-editor")).toContainText("BBB", {
      timeout: 5_000,
    });
    await expect(pageB.locator(".monaco-editor")).toContainText("AAA", {
      timeout: 5_000,
    });
    await expect(pageB.locator(".monaco-editor")).toContainText("BBB", {
      timeout: 5_000,
    });

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

    // Bring context B back online
    await contextB.setOffline(false);

    // Page A should receive the offline edit
    await expect(pageA.locator(".monaco-editor")).toContainText(
      "Offline edit",
      { timeout: 10_000 },
    );

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
    await expect(presenceUsers).toHaveCount(2, { timeout: 5_000 });

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

    // Reload the page
    await page.reload();
    await waitForEditor(page);

    await expect(page.locator(".monaco-editor")).toContainText(
      "persistent content here",
      { timeout: 10_000 },
    );

    await context.close();
  });

  test("room creation flow from landing page", async ({ page }) => {
    await page.goto(BASE_URL);

    // Click Create Room
    await page.click('button:has-text("Create Room")');
    await page.waitForSelector('[role="dialog"]');

    // Fill form
    await page.fill('input[placeholder="My Coding Session"]', "My Test Room");
    await page.click('button[type="submit"]:has-text("Create Room")');

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

    // Enter room code and join
    await page.fill('input[placeholder="Paste a room code or URL…"]', roomId);
    await page.click('button:has-text("Join")');

    await page.waitForURL(/\/room\//, { timeout: 10_000 });
    await waitForEditor(page);

    await expect(page.locator(".monaco-editor")).toBeVisible();

    await context.close();
  });
});
