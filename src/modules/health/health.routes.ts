import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "crm-whatsapp-integration",
    timestamp: new Date().toISOString(),
  });
});
