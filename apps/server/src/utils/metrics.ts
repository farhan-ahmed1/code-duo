import {
  Registry,
  Gauge,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";

export const metricsRegistry = new Registry();

export const activeConnections = new Gauge({
  name: "codeduo_active_connections",
  help: "Number of active WebSocket connections",
  registers: [metricsRegistry],
});

export const activeRooms = new Gauge({
  name: "codeduo_active_rooms",
  help: "Number of rooms with at least one connected user",
  registers: [metricsRegistry],
});

export const messagesTotal = new Counter({
  name: "codeduo_messages_total",
  help: "Total WebSocket messages relayed",
  registers: [metricsRegistry],
});

export const documentSavesTotal = new Counter({
  name: "codeduo_document_saves_total",
  help: "Total document persistence writes",
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: "codeduo_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [metricsRegistry],
});

export function initMetrics() {
  collectDefaultMetrics({ register: metricsRegistry });
}
