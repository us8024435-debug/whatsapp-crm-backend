import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({ name: "error-handler" });

/**
 * Global Express error handler.
 * Logs the error, returns a safe JSON response. Never leaks stack traces in production.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, "Unhandled error");

  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

  res.status(statusCode).json({
    ok: false,
    error: message,
  });
}
