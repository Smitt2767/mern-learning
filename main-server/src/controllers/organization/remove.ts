import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function removeOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const { organization } = req.organizationMember!;

  await OrganizationService.softDelete(organization.id);

  res.status(200).json({
    success: true,
    message: "Organization deleted successfully",
  });
}
