import { prisma } from "../../db/prisma";
import pino from "pino";

const logger = pino({ name: "contacts-service" });

/**
 * Creates a new contact or updates the name if the contact already exists.
 * Keyed by unique phone number.
 */
export async function upsertContact(phone: string, name: string | null) {
  const contact = await prisma.contact.upsert({
    where: { phone },
    update: {
      ...(name ? { name } : {}),
    },
    create: {
      phone,
      name,
      source: "whatsapp",
    },
  });

  logger.info({ contactId: contact.id, phone }, "Contact upserted");
  return contact;
}

/**
 * Fetches a single contact by ID.
 */
export async function getContactById(contactId: string) {
  return prisma.contact.findUnique({
    where: { id: contactId },
  });
}
