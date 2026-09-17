import pino from "pino";
import { CrmAdapter } from "./crm.adapter";
import { prisma } from "../../db/prisma";

const logger = pino({ name: "internal-crm" });

/**
 * Internal CRM Adapter — stores everything in the local PostgreSQL database.
 * This is the default for MVP. Other adapters (HubSpot, Zoho, etc.)
 * will implement the same CrmAdapter interface.
 */
export class InternalCrmAdapter implements CrmAdapter {
  async createLead(data: {
    contactPhone: string;
    contactName: string | null;
    source: string;
  }) {
    const contact = await prisma.contact.findUnique({
      where: { phone: data.contactPhone },
    });

    if (!contact) {
      logger.warn({ phone: data.contactPhone }, "Contact not found for lead creation");
      return {};
    }

    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        source: data.source,
        status: "new",
      },
    });

    logger.info({ leadId: lead.id }, "Lead created via internal CRM adapter");
    return { externalId: lead.id };
  }

  async updateLeadStatus(leadId: string, status: string) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    logger.info({ leadId, status }, "Lead status updated");
  }

  async addNote(leadId: string, note: string) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { notes: note },
    });

    logger.info({ leadId }, "Note added to lead");
  }

  async syncContact(data: {
    phone: string;
    name: string | null;
    source: string;
  }) {
    await prisma.contact.upsert({
      where: { phone: data.phone },
      update: { name: data.name },
      create: {
        phone: data.phone,
        name: data.name,
        source: data.source,
      },
    });

    logger.info({ phone: data.phone }, "Contact synced via internal CRM adapter");
  }
}
