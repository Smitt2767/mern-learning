import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function listOrganizations(
  req: Request,
  res: Response,
): Promise<void> {
  const memberships = await OrganizationService.findAllByUserId(req.user!.id);

  res.status(200).json({ success: true, data: { organizations: memberships } });
}
