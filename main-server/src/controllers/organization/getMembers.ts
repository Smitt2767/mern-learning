import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function getMembers(req: Request, res: Response): Promise<void> {
  const { organization } = req.organizationMember!;

  const members = await OrganizationService.findMembers(organization.id);

  res.status(200).json({ success: true, data: { members } });
}
