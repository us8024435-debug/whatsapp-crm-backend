import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Middleware to authenticate requests to protected APIs (/api/leads, /api/messages).
 * Accepts Authorization: Bearer <API_SECRET_KEY> or x-api-key: <API_SECRET_KEY>.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"] as string | undefined;

  const expectedKey = process.env.API_SECRET_KEY || "dev-secret-key-change-in-production";

  let providedToken: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    providedToken = apiKeyHeader.trim();
  }

  if (!providedToken) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized: Missing Authorization header or x-api-key",
    });
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedToken);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized: Invalid API token",
    });
  }

  next();
}
