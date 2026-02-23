import { getRequestListener } from "@hono/node-server";
import { createServer } from "node:http";
import { Hono } from "hono";
import { WebSocketServer } from "ws";
import { apiRouter, markServerReady } from "./api/routes";
import { corsMiddleware, requestLogger, errorHandler } from "./api/middleware";
import { apiRateLimit } from "./api/rate-limiter";
import { bodySizeLimit } from "./api/validation";
import { setupWebSocketServer } from "./ws-server";
import { startRoomCleanupJob } from "./jobs/room-cleanup";
import { logger } from "./utils/logger";
import { initMetrics, metricsRegistry } from "./utils/metrics";

const PORT = Number(process.env.PORT ?? 4000);

const app = new Hono();

// ── Global middleware ──────────────────────────────────────────────
app.use("*", corsMiddleware);
app.use("*", requestLogger);
app.use("/api/*", bodySizeLimit);
app.use("/api/*", apiRateLimit);

// ── Routes ─────────────────────────────────────────────────────────
app.route("/api", apiRouter);

/**
 * GET /metrics — top-level Prometheus scrape endpoint.
 *
 * Mounted outside `/api` so rate-limiting and body-size middleware
 * do not interfere with Prometheus scraping.
 */
app.get("/metrics", async (c) => {
  const metrics = await metricsRegistry.metrics();
  return c.text(metrics, 200, {
    "Content-Type": metricsRegistry.contentType,
  });
});

app.onError(errorHandler);

const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

setupWebSocketServer(wss);

httpServer.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/yjs/")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

httpServer.on("request", getRequestListener(app.fetch));

httpServer.listen(PORT, () => {
  logger.info({ port: PORT, event: "server_start" }, "Code Duo server started");
  initMetrics();
  startRoomCleanupJob();
  markServerReady();
  logger.info({ event: "server_ready" }, "Server fully initialised and ready");
});

export { app };
