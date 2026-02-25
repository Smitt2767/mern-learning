import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function getOrgRoles(req: Request, res: Response): Promise<void> {
  const { organization } = req.organizationMember!;

  const roles = await OrganizationService.findOrgRoles(organization.id);

  res.status(200).json({ success: true, data: { roles } });
}
