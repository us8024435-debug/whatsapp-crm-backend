import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { healthRouter } from "./modules/health/health.routes";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes";
import { leadsRouter } from "./modules/leads/leads.routes";
import { messagesRouter } from "./modules/messages/messages.routes";
import { demoRouter } from "./modules/demo/demo.routes";

export const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend-url.onrender.com",
      /\.vercel\.app$/,
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use(requestLogger);

// JSON body parser for API routes (webhook route uses raw body separately)
app.use("/api", express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/webhooks/whatsapp", whatsappRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/messages", messagesRouter);

// Demo simulator route — disabled in production to prevent fake lead injection
if (process.env.NODE_ENV !== "production") {
  app.use("/api/demo", demoRouter);
}

// ── Error Handler ──────────────────────────────────────
app.use(errorHandler);
