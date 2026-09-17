import { Request, Response } from "express";
import pino from "pino";
import { isValidMetaSignature } from "./whatsapp.signature";
import {
  saveWebhookEvent,
  parseInboundMessages,
  parseStatusUpdates,
  updateMessageStatus,
} from "./whatsapp.service";
import { upsertContact } from "../contacts/contacts.service";
import { createLeadIfNew } from "../leads/leads.service";
import { saveInboundMessage } from "../messages/messages.service";

const logger = pino({ name: "whatsapp-controller" });

/**
 * GET /webhooks/whatsapp — Meta webhook verification.
 */
export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    logger.info("Webhook verification succeeded");
    return res.status(200).send(challenge);
  }

  logger.warn("Webhook verification failed");
  return res.sendStatus(403);
}

/**
 * POST /webhooks/whatsapp — Receive inbound messages and status updates.
 * Validates signature, stores event, processes messages and status callbacks, returns 200 fast.
 */
export async function handleIncomingWebhook(req: Request, res: Response) {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;

  if (!isValidMetaSignature(req.body as Buffer, signature)) {
    logger.warn("Invalid webhook signature");
    return res.sendStatus(401);
  }

  // Safe JSON parse raw body
  let payload: any;
  try {
    payload = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch (err) {
    logger.warn({ err }, "Malformed webhook JSON payload");
    return res.sendStatus(400);
  }

  // Extract unique provider event identifier for deduplication
  const firstMsgId = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id;
  const firstStatus = payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
  const firstStatusId = firstStatus ? `${firstStatus.id}_${firstStatus.status}` : undefined;
  const providerEventId = firstMsgId || firstStatusId || payload?.entry?.[0]?.id;
  const eventType = firstStatus ? "status" : "message";

  // 1. Save raw webhook event (deduplicates if providerEventId is already recorded)
  const event = await saveWebhookEvent(payload, providerEventId, eventType);
  if (!event) {
    // Duplicate event — return 200 so Meta doesn't retry
    return res.sendStatus(200);
  }

  // 2. Process message status callbacks (sent, delivered, read, failed)
  const statusUpdates = parseStatusUpdates(payload);
  for (const st of statusUpdates) {
    try {
      await updateMessageStatus(st.providerMessageId, st.status, st.rawPayload);
    } catch (err) {
      logger.error(
        { err, providerMessageId: st.providerMessageId },
        "Failed to process message status callback"
      );
    }
  }

  // 3. Process inbound messages
  const messages = parseInboundMessages(payload);

  for (const msg of messages) {
    try {
      // Upsert contact
      const contact = await upsertContact(msg.from, msg.contactName);

      // Create lead if needed
      await createLeadIfNew(contact.id);

      // Save inbound message
      await saveInboundMessage({
        providerMessageId: msg.providerMessageId,
        contactId: contact.id,
        type: msg.type,
        text: msg.text,
        rawPayload: msg.rawPayload,
      });

      logger.info(
        { providerMessageId: msg.providerMessageId, contactId: contact.id },
        "Inbound message processed"
      );
    } catch (err) {
      // Log but don't fail the whole webhook — partial success is OK
      logger.error({ err, providerMessageId: msg.providerMessageId }, "Failed to process message");
    }
  }

  // Return 200 quickly — Meta retries if we're slow
  return res.sendStatus(200);
}
