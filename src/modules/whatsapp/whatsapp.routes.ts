import { Router } from "express";
import express from "express";
import { verifyWebhook, handleIncomingWebhook } from "./whatsapp.controller";
import { asyncHandler } from "../../utils/async-handler";

export const whatsappRouter = Router();

// GET — Meta webhook verification (hub.mode, hub.verify_token, hub.challenge)
whatsappRouter.get("/", verifyWebhook);

// POST — Receive inbound messages (raw body needed for signature verification)
whatsappRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  asyncHandler(handleIncomingWebhook)
);
