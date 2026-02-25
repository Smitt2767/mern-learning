import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function leaveOrganization(
  req: Request,
  res: Response,
): Promise<void> {
  const { organization, member, role } = req.organizationMember!;

  // Owner cannot leave — must transfer ownership or delete the org first
  if (role.name === "owner") {
    throw AppError.forbidden(
      "Owners cannot leave the organization. Transfer ownership or delete the organization first.",
    );
  }

  await OrganizationService.removeMember(organization.id, member.userId);

  res.status(200).json({
    success: true,
    message: "You have left the organization",
  });
}
