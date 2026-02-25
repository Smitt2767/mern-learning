import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { z } from "zod";
import { OrganizationService } from "../../services/organization.js";

const schema = z.object({
  name: z.string().min(2).max(255).optional(),
  logo: z.url().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function updateOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const input = schema.parse(req.body);
  const { organization } = req.organizationMember!;

  const updated = await OrganizationService.update(organization.id, input);
  if (!updated) throw AppError.notFound("Organization not found");

  res.status(200).json({ success: true, data: { organization: updated } });
}
