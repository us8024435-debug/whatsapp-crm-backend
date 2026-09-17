import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { sendWhatsAppMessage } from "../whatsapp/whatsapp.service";
import { asyncHandler } from "../../utils/async-handler";
import { requireAuth } from "../../middleware/auth";

export const messagesRouter = Router();

// Protect all message endpoints with authentication
messagesRouter.use(requireAuth);

const sendMessageSchema = z.object({
  to: z.string().min(10, "Phone number is required"),
  text: z.string().min(1, "Message text is required"),
});

/**
 * POST /api/messages/send — Send an outbound WhatsApp text message.
 */
messagesRouter.post(
  "/send",
  asyncHandler(async (req, res) => {
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { to, text } = parsed.data;

    // Ensure contact exists before creating outbound message (guarantees valid contactId)
    const contact = await prisma.contact.upsert({
      where: { phone: to },
      update: {},
      create: {
        phone: to,
        source: "whatsapp",
      },
    });

    // Send via WhatsApp Cloud API
    const { providerMessageId } = await sendWhatsAppMessage(to, text);

    // Save outbound message
    const message = await prisma.message.create({
      data: {
        providerMessageId,
        contactId: contact.id,
        direction: "outbound",
        type: "text",
        text,
        status: "sent",
      },
    });

    res.json({ ok: true, data: message });
  })
);

/**
 * GET /api/messages/contacts/:id/messages — Message history for a contact.
 */
messagesRouter.get(
  "/contacts/:id/messages",
  asyncHandler(async (req, res) => {
    const contactId = req.params.id as string;
    const messages = await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ ok: true, data: messages });
  })
);
