import type { Request, Response } from "express";
import { z } from "zod";

import { OrganizationService } from "../../services/organization.js";

const listOrgsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function listOrganizations(
  req: Request,
  res: Response,
): Promise<void> {
  const { page, limit } = listOrgsSchema.parse(req.query);
  const result = await OrganizationService.findAll({ page, limit });
  res.status(200).json({ success: true, data: result });
}
