import { prisma } from "../../db/prisma";
import pino from "pino";

const logger = pino({ name: "messages-service" });

interface SaveInboundMessageInput {
  providerMessageId: string;
  contactId: string;
  type: string;
  text: string | null;
  rawPayload: any;
}

/**
 * Saves an inbound message. Deduplicates by providerMessageId.
 */
export async function saveInboundMessage(input: SaveInboundMessageInput) {
  // Check for duplicate
  const existing = await prisma.message.findUnique({
    where: { providerMessageId: input.providerMessageId },
  });

  if (existing) {
    logger.info(
      { providerMessageId: input.providerMessageId },
      "Duplicate message — skipping"
    );
    return existing;
  }

  const message = await prisma.message.create({
    data: {
      providerMessageId: input.providerMessageId,
      contactId: input.contactId,
      direction: "inbound",
      type: input.type,
      text: input.text,
      rawPayload: input.rawPayload,
      status: "received",
    },
  });

  logger.info(
    { messageId: message.id, providerMessageId: input.providerMessageId },
    "Inbound message saved"
  );

  return message;
}
