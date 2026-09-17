import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/async-handler";
import { requireAuth } from "../../middleware/auth";

export const leadsRouter = Router();

// Protect all lead management endpoints
leadsRouter.use(requireAuth);

/**
 * GET /api/leads — List all leads with contact info.
 * Supports optional status filter: ?status=new
 */
leadsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;

    const leads = await prisma.lead.findMany({
      where: status ? { status } : undefined,
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ ok: true, data: leads });
  })
);

/**
 * GET /api/leads/:id — Get a single lead with contact info.
 */
leadsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true },
    });

    if (!lead) {
      return res.status(404).json({ ok: false, error: "Lead not found" });
    }

    res.json({ ok: true, data: lead });
  })
);

/**
 * PATCH /api/leads/:id/status — Update lead status.
 */
leadsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const leadId = req.params.id as string;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({ ok: false, error: "status is required" });
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    res.json({ ok: true, data: lead });
  })
);
