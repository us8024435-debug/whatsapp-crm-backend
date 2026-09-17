import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { upsertContact } from "../contacts/contacts.service";
import { createLeadIfNew } from "../leads/leads.service";
import { saveInboundMessage } from "../messages/messages.service";
import { asyncHandler } from "../../utils/async-handler";

export const demoRouter = Router();

// Ensure demo simulator is inaccessible in production environments
demoRouter.use((_req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  next();
});

const demoInboundSchema = z.object({
  phone: z.string().min(8, "Valid phone number is required"),
  name: z.string().min(1, "Name is required"),
  message: z.string().min(1, "Message text is required"),
  interestType: z.string().optional(),
});

/**
 * POST /api/demo/inbound-message
 * Simulates an incoming WhatsApp message without needing Meta credentials.
 * Upserts Contact, creates Lead (if no open lead exists), and saves inbound Message.
 */
demoRouter.post(
  "/inbound-message",
  asyncHandler(async (req, res) => {
    const parsed = demoInboundSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { phone, name, message, interestType } = parsed.data;

    // 1. Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: { phone },
    });
    const contact = await upsertContact(phone, name);
    const contactCreated = !existingContact;

    // 2. Check if an open lead already exists before calling service
    const existingOpenLead = await prisma.lead.findFirst({
      where: {
        contactId: contact.id,
        status: { in: ["new", "contacted"] },
      },
    });

    // Create lead if new
    const lead = await createLeadIfNew(contact.id);
    const leadCreated = !existingOpenLead;

    // If a new lead was created and interestType provided, attach it
    if (leadCreated && interestType) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          title: `Inquiry: ${interestType}`,
          notes: `Interest type: ${interestType}`,
        },
      });
    }

    // 3. Save inbound message
    const providerMessageId = `demo_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const savedMessage = await saveInboundMessage({
      providerMessageId,
      contactId: contact.id,
      type: "text",
      text: message,
      rawPayload: {
        source: "demo_inbound_api",
        phone,
        name,
        message,
        interestType: interestType ?? null,
      },
    });

    // 4. Return structured response
    return res.status(200).json({
      ok: true,
      contactCreated,
      leadCreated,
      messageSaved: true,
      data: {
        contact: {
          id: contact.id,
          phone: contact.phone,
          name: contact.name,
        },
        lead: {
          id: lead.id,
          status: lead.status,
          contactId: lead.contactId,
        },
        message: {
          id: savedMessage.id,
          providerMessageId: savedMessage.providerMessageId,
          text: savedMessage.text,
          direction: savedMessage.direction,
        },
      },
    });
  })
);
