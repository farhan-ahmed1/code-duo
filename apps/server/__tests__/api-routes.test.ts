import { afterEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { apiRouter, roomStore } from "../src/api/routes.js";
import { bodySizeLimit } from "../src/api/validation.js";
import { ERROR_CODES } from "../src/api/errors.js";

const createdRoomIds: string[] = [];

afterEach(async () => {
  for (const roomId of createdRoomIds.splice(0)) {
    roomStore.deleteRoom(roomId);
  }
});

describe("API routes", () => {
  it("creates a room and returns a room URL", async () => {
    const response = await apiRouter.request("http://localhost/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Backend Architect Room",
        language: "typescript",
      }),
    });

    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      id: string;
      name: string;
      language: string;
      url: string;
    };

    createdRoomIds.push(body.id);

    expect(body.name).toBe("Backend Architect Room");
    expect(body.language).toBe("typescript");
    expect(body.url).toBe(`/room/${body.id}`);
  });

  it("returns room metadata with active user count", async () => {
    const createResponse = await apiRouter.request("http://localhost/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Realtime Room", language: "python" }),
    });

    const created = (await createResponse.json()) as { id: string };
    createdRoomIds.push(created.id);

    const response = await apiRouter.request(
      `http://localhost/rooms/${created.id}`,
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      id: string;
      activeUserCount: number;
    };

    expect(body.id).toBe(created.id);
    expect(body.activeUserCount).toBe(0);
  });

  it("rejects room names longer than 100 characters", async () => {
    const response = await apiRouter.request("http://localhost/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "x".repeat(101),
        language: "typescript",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Room name must be 100 characters or fewer",
      code: ERROR_CODES.ROOM_NAME_TOO_LONG,
    });
  });

  it("returns a stable error code for invalid JSON bodies", async () => {
    const response = await apiRouter.request("http://localhost/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: '{"name": "broken"',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid JSON body",
      code: ERROR_CODES.INVALID_JSON_BODY,
    });
  });

  it("returns a stable error code for missing rooms", async () => {
    const response = await apiRouter.request("http://localhost/rooms/does-not-exist");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "Room not found",
      code: ERROR_CODES.ROOM_NOT_FOUND,
    });
  });

  it("rejects oversized request bodies without a content-length header", async () => {
    const oversizedPayload = JSON.stringify({
      name: "ok",
      language: "typescript",
      padding: "x".repeat(70_000),
    });

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(oversizedPayload));
        controller.close();
      },
    });

    const app = new Hono();
    app.use("*", bodySizeLimit);
    app.route("/", apiRouter);

    const response = await app.request("http://localhost/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      duplex: "half",
    } as RequestInit);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: "Request body too large. Maximum size is 65536 bytes.",
      code: ERROR_CODES.REQUEST_BODY_TOO_LARGE,
    });
  });
});
