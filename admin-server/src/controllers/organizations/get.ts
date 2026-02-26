import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { OrganizationService } from "../../services/organization.js";

export async function getOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as { id: string };

  const org = await OrganizationService.findByIdForAdmin(id);
  if (!org) throw AppError.notFound("Organization not found");

  res.status(200).json({ success: true, data: org });
}
