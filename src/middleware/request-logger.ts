import pinoHttp from "pino-http";

/**
 * Structured HTTP request/response logger using Pino.
 */
export const requestLogger = pinoHttp({
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true,
  },
});
