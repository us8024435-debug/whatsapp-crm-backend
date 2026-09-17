import pino from "pino";
import { prisma } from "../../db/prisma";
import {
  WhatsAppWebhookPayload,
  ParsedInboundMessage,
  ParsedStatusUpdate,
} from "./whatsapp.types";

const logger = pino({ name: "whatsapp-service" });

interface WhatsAppSendResponse {
  messaging_product?: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
}

/**
 * Saves the raw webhook event for audit and replay.
 * Returns null if the event was already processed (deduplication).
 */
export async function saveWebhookEvent(payload: any, providerEventId?: string, eventType = "message") {
  // Deduplicate by providerEventId if available
  if (providerEventId) {
    const existing = await prisma.webhookEvent.findUnique({
      where: { providerEventId },
    });
    if (existing) {
      logger.info({ providerEventId }, "Duplicate webhook event — skipping");
      return null;
    }
  }

  try {
    return await prisma.webhookEvent.create({
      data: {
        providerEventId,
        source: "whatsapp",
        eventType,
        payload,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      logger.info({ providerEventId }, "Duplicate webhook event (caught P2002 race condition) — skipping");
      return null;
    }
    throw err;
  }
}

/**
 * Parses inbound messages from a Meta webhook payload.
 * Returns an array of normalized messages (there can be multiple per webhook call).
 */
export function parseInboundMessages(payload: WhatsAppWebhookPayload): ParsedInboundMessage[] {
  const results: ParsedInboundMessage[] = [];

  if (payload.object !== "whatsapp_business_account") {
    return results;
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const contacts = value.contacts ?? [];
      const messages = value.messages ?? [];

      for (const msg of messages) {
        const contact = contacts.find((c) => c.wa_id === msg.from);

        results.push({
          providerMessageId: msg.id,
          from: msg.from,
          contactName: contact?.profile?.name ?? null,
          type: msg.type,
          text: msg.text?.body ?? null,
          timestamp: msg.timestamp,
          rawPayload: msg,
        });
      }
    }
  }

  return results;
}

/**
 * Parses message status updates (sent, delivered, read, failed) from a Meta webhook payload.
 */
export function parseStatusUpdates(payload: WhatsAppWebhookPayload): ParsedStatusUpdate[] {
  const results: ParsedStatusUpdate[] = [];

  if (payload.object !== "whatsapp_business_account") {
    return results;
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const statuses = value.statuses ?? [];

      for (const st of statuses) {
        results.push({
          providerMessageId: st.id,
          status: st.status,
          recipientId: st.recipient_id,
          timestamp: st.timestamp,
          rawPayload: st,
        });
      }
    }
  }

  return results;
}

/**
 * Updates status of an existing message in the database when Meta delivers a status callback.
 */
export async function updateMessageStatus(providerMessageId: string, status: string, rawPayload?: any) {
  const existing = await prisma.message.findUnique({
    where: { providerMessageId },
  });

  if (!existing) {
    logger.info({ providerMessageId, status }, "Status callback received for message not found in local DB — skipping update");
    return null;
  }

  const updated = await prisma.message.update({
    where: { providerMessageId },
    data: {
      status,
      rawPayload: rawPayload
        ? { ...(existing.rawPayload as any), latestStatusUpdate: rawPayload }
        : existing.rawPayload,
    },
  });

  logger.info({ providerMessageId, status }, "Message status updated via WhatsApp callback");
  return updated;
}

/**
 * Sends an outbound WhatsApp text message via the Cloud API.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ to, status: response.status, error }, "WhatsApp send failed");
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  const data = (await response.json()) as WhatsAppSendResponse;
  const providerMessageId = data?.messages?.[0]?.id ?? null;

  logger.info({ to, providerMessageId }, "WhatsApp message sent");

  return { providerMessageId, data };
}
