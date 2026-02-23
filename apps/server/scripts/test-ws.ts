/**
 * WebSocket connectivity test script.
 *
 * Creates two Yjs Y.Doc instances, connects both to the server
 * via y-websocket's WebsocketProvider, modifies Y.Text on one doc,
 * and asserts the change appears on the other.
 *
 * Usage:
 *   1. Start the server:  pnpm --filter @code-duo/server dev
 *   2. Run this script:   npx tsx apps/server/scripts/test-ws.ts
 */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { WebSocket } from "ws";

const SERVER_URL = process.env.WS_URL ?? "ws://localhost:4000";
const ROOM_NAME = `test-room-${Date.now()}`;
const TIMEOUT_MS = 10_000;
const TEST_TEXT = "Hello from Doc A!";
const REVERSE_TEXT = "Hello from Doc B!";

// y-websocket needs a WebSocket implementation in Node.js
// @ts-expect-error — global polyfill for y-websocket in Node
globalThis.WebSocket = WebSocket;

function createClientDoc(name: string): {
  doc: Y.Doc;
  provider: WebsocketProvider;
} {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(SERVER_URL, `yjs/${ROOM_NAME}`, doc, {
    WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
  });
  provider.on("status", ({ status }: { status: string }) => {
    console.log(`  [${name}] status: ${status}`);
  });
  return { doc, provider };
}

function waitForSync(provider: WebsocketProvider): Promise<void> {
  return new Promise((resolve, reject) => {
    if (provider.synced) return resolve();
    const timer = setTimeout(
      () => reject(new Error("Sync timeout")),
      TIMEOUT_MS,
    );
    provider.once("sync", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function waitForText(ytext: Y.Text, expected: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ytext.toString().includes(expected)) return resolve();
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `Timed out waiting for "${expected}". Current: "${ytext.toString()}"`,
          ),
        ),
      TIMEOUT_MS,
    );
    const handler = () => {
      if (ytext.toString().includes(expected)) {
        clearTimeout(timer);
        ytext.unobserve(handler);
        resolve();
      }
    };
    ytext.observe(handler);
  });
}

async function cleanup(...providers: WebsocketProvider[]) {
  for (const p of providers) {
    p.disconnect();
    p.destroy();
  }
}

async function main() {
  console.log(`\n🧪 WebSocket sync test — room: ${ROOM_NAME}\n`);

  // --- Create two clients ---
  console.log("1. Creating Doc A and Doc B…");
  const clientA = createClientDoc("A");
  const clientB = createClientDoc("B");

  // --- Wait for both to sync with server ---
  console.log("2. Waiting for initial sync…");
  await Promise.all([
    waitForSync(clientA.provider),
    waitForSync(clientB.provider),
  ]);
  console.log("   ✅ Both clients synced with server.\n");

  // --- Test A → B sync ---
  console.log(`3. Inserting "${TEST_TEXT}" in Doc A…`);
  const textA = clientA.doc.getText("monaco");
  const textB = clientB.doc.getText("monaco");
  textA.insert(0, TEST_TEXT);
  await waitForText(textB, TEST_TEXT);
  console.log(`   ✅ Doc B received: "${textB.toString()}"\n`);

  // --- Test B → A sync (bidirectional) ---
  console.log(`4. Inserting "${REVERSE_TEXT}" in Doc B…`);
  textB.insert(textB.length, `\n${REVERSE_TEXT}`);
  await waitForText(textA, REVERSE_TEXT);
  console.log(`   ✅ Doc A received: "${textA.toString()}"\n`);

  // --- Verify convergence ---
  const finalA = textA.toString();
  const finalB = textB.toString();
  if (finalA === finalB) {
    console.log("5. ✅ PASS — Both docs converged to the same state:");
    console.log(`   "${finalA}"\n`);
  } else {
    console.error("5. ❌ FAIL — Documents diverged!");
    console.error(`   Doc A: "${finalA}"`);
    console.error(`   Doc B: "${finalB}"`);
    await cleanup(clientA.provider, clientB.provider);
    process.exit(1);
  }

  await cleanup(clientA.provider, clientB.provider);
  console.log("Done. All tests passed.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
