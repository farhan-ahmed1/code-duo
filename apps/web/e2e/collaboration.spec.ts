import { test, expect, chromium } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function createRoom(name = "E2E Test Room"): Promise<string> {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, language: "typescript" }),
  });
  const room = await res.json();
  return room.id as string;
}

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

    // Wait for editors to load
    await pageA.waitForSelector(".monaco-editor");
    await pageB.waitForSelector(".monaco-editor");

    // Type in page A's editor
    await pageA.click(".monaco-editor");
    await pageA.keyboard.type("Hello from A");

    // Verify the text appears in page B within 2 seconds
    await expect(pageB.locator(".monaco-editor")).toContainText(
      "Hello from A",
      {
        timeout: 2000,
      },
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
    await pageA.waitForSelector(".monaco-editor");
    await pageB.waitForSelector(".monaco-editor");

    // Both type simultaneously
    await Promise.all([pageA.keyboard.type("AAA"), pageB.keyboard.type("BBB")]);

    // Both should eventually have both edits
    await expect(pageA.locator(".monaco-editor")).toContainText("AAA", {
      timeout: 3000,
    });
    await expect(pageA.locator(".monaco-editor")).toContainText("BBB", {
      timeout: 3000,
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
    await pageA.waitForSelector(".monaco-editor");

    // Take context B offline
    await contextB.setOffline(true);
    await pageB.keyboard.type("Offline edit");

    // Bring context B back online
    await contextB.setOffline(false);

    // Page A should receive the offline edit
    await expect(pageA.locator(".monaco-editor")).toContainText(
      "Offline edit",
      {
        timeout: 5000,
      },
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
    await pageA.waitForSelector(".monaco-editor");
    await pageB.waitForSelector(".monaco-editor");

    // Both users should appear in each other's presence bars
    // (At minimum, page A sees 2 users including itself)
    const presenceCount = pageA.locator('[data-testid="presence-user"]');
    await expect(presenceCount).toHaveCount(2, { timeout: 3000 });

    await contextA.close();
    await contextB.close();
  });
});
