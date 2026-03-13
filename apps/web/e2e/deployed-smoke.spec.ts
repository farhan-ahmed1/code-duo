import { test, expect, type Page } from "@playwright/test";

const API_URL = process.env.API_URL;

async function createRoom(
  name = "Deployed Smoke Room",
  language = "typescript",
): Promise<string> {
  if (!API_URL) {
    throw new Error("API_URL must be set for deployed smoke tests");
  }

  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, language }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create room: ${res.status}`);
  }

  const room = await res.json();
  return room.id as string;
}

async function waitForEditor(page: Page) {
  await page.waitForSelector(".monaco-editor .view-lines", {
    timeout: 15_000,
    state: "visible",
  });
  await page.waitForTimeout(500);
}

async function typeInEditor(page: Page, text: string) {
  await page.click(".monaco-editor .view-lines");
  await page.keyboard.press("Escape");
  await page.keyboard.press("End");
  await page.keyboard.insertText(text);
  await page.keyboard.press("Escape");
}

async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    type TestWindow = {
      __codeDuoGetEditorValue?: () => string;
      monaco?: { editor?: { getModels?: () => Array<{ getValue(): string }> } };
    };

    const win = window as unknown as TestWindow;
    if (typeof win.__codeDuoGetEditorValue === "function") {
      return win.__codeDuoGetEditorValue();
    }

    const models = win.monaco?.editor?.getModels?.();
    return models?.[0]?.getValue() ?? "";
  });
}

test.describe("Deployed smoke", () => {
  test("live frontend and backend collaborate across two sessions", async ({
    browser,
    baseURL,
  }) => {
    test.skip(
      !baseURL,
      "PLAYWRIGHT_BASE_URL must be set for deployed smoke tests",
    );
    test.skip(!API_URL, "API_URL must be set for deployed smoke tests");

    const deployedBaseUrl = baseURL ?? "";

    const roomId = await createRoom();
    const roomUrl = `/room/${roomId}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto(deployedBaseUrl);
    await expect(pageA).toHaveTitle(/Code Duo/i);

    await pageA.goto(roomUrl);
    await pageB.goto(roomUrl);

    await waitForEditor(pageA);
    await waitForEditor(pageB);

    const marker = `DEPLOY_SMOKE_${Date.now()}`;
    await typeInEditor(pageA, `${marker} `);

    await expect
      .poll(() => getEditorText(pageB), { timeout: 15_000 })
      .toContain(marker);

    await contextA.close();
    await contextB.close();
  });
});
