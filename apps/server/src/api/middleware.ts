import { MiddlewareHandler, ErrorHandler } from "hono";
import { cors } from "hono/cors";
import { logger } from "../utils/logger";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

export const corsMiddleware = cors({
  origin: ALLOWED_ORIGIN,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
});

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  });
};

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error({ err }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
};
