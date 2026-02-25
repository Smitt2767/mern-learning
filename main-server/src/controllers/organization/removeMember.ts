import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { OrganizationService } from "../../services/organization.js";

export async function removeMember(req: Request, res: Response): Promise<void> {
  const { userId } = req.params as { userId: string };
  const { organization } = req.organizationMember!;

  const targetMember = await OrganizationService.findMember(
    organization.id,
    userId,
  );
  if (!targetMember) throw AppError.notFound("Member not found");

  // Protect the owner from being removed
  const orgRoles = await OrganizationService.findOrgRoles(organization.id);
  const targetRole = orgRoles.find((r) => r.id === targetMember.roleId);
  if (targetRole?.name === "owner") {
    throw AppError.forbidden(
      "Cannot remove the owner. Transfer ownership first.",
    );
  }

  await OrganizationService.removeMember(organization.id, userId);

  res.status(200).json({ success: true, message: "Member removed" });
}
