import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { OrganizationService } from "../../services/organization.js";

export async function deleteOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as { id: string };

  // Verify the org exists before attempting deletion
  const org = await OrganizationService.findByIdForAdmin(id);
  if (!org) throw AppError.notFound("Organization not found");

  await OrganizationService.forceDelete(id);

  res.status(200).json({
    success: true,
    message: `Organization "${org.name}" has been permanently deleted.`,
  });
}
