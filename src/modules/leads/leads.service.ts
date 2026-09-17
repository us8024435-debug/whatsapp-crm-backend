import { prisma } from "../../db/prisma";
import pino from "pino";

const logger = pino({ name: "leads-service" });

/**
 * Creates a new lead for a contact if they don't already have an open lead.
 * "Open" means status is "new" or "contacted".
 */
export async function createLeadIfNew(contactId: string) {
  const existingLead = await prisma.lead.findFirst({
    where: {
      contactId,
      status: { in: ["new", "contacted"] },
    },
  });

  if (existingLead) {
    logger.info({ contactId, leadId: existingLead.id }, "Open lead already exists");
    return existingLead;
  }

  const lead = await prisma.lead.create({
    data: {
      contactId,
      status: "new",
      source: "whatsapp",
    },
  });

  logger.info({ contactId, leadId: lead.id }, "New lead created");
  return lead;
}
