import pino from "pino";

/**
 * Structured JSON logger powered by pino.
 *
 * In production mode, outputs newline-delimited JSON suitable for
 * ingestion by any log aggregator (ELK, Datadog, Loki, etc.).
 * In development, pipes through pino-pretty for human-readable output.
 *
 * All logs include `service` and, when provided via child loggers,
 * contextual fields like `roomId`, `userId`, `event`, and `duration`.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // Base context included in every log line
  base: { service: "codeduo-server", pid: process.pid },
  // Timestamp as ISO string for structured log aggregators
  timestamp: pino.stdTimeFunctions.isoTime,
  // Serialise Error objects properly (stack, message, code)
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});

/**
 * Create a child logger pre-bound with room / user context.
 * Use this inside WebSocket handlers and API routes so every log
 * line automatically includes the relevant identifiers.
 *
 * @example
 * ```ts
 * const log = createContextLogger({ roomId: "abc123", userId: "u1" });
 * log.info({ event: "doc_save", duration: 12 }, "Document persisted");
 * ```
 */
export function createContextLogger(ctx: {
  roomId?: string;
  userId?: string;
  [key: string]: unknown;
}) {
  return logger.child(ctx);
}
