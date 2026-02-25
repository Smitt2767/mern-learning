import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { z } from "zod";
import { OrganizationService } from "../../services/organization.js";

const schema = z.object({
  roleId: z.string().uuid(),
});

export async function updateMemberRole(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId } = req.params as { userId: string };
  const { roleId } = schema.parse(req.body);
  const { organization, member: callerMember } = req.organizationMember!;

  // Cannot change your own role
  if (userId === callerMember.userId) {
    throw AppError.forbidden("You cannot change your own role");
  }

  // Resolve the target member and their current role
  const targetMember = await OrganizationService.findMember(
    organization.id,
    userId,
  );
  if (!targetMember) throw AppError.notFound("Member not found");

  // Resolve target's current role name to enforce owner protection
  const orgRoles = await OrganizationService.findOrgRoles(organization.id);
  const targetRole = orgRoles.find((r) => r.id === targetMember.roleId);
  const callerRole = orgRoles.find((r) => r.id === callerMember.roleId);

  // Owner cannot be demoted — must use transferOwnership
  if (targetRole?.name === "owner") {
    throw AppError.forbidden(
      "Cannot demote the owner. Use transfer ownership instead.",
    );
  }

  // Admin cannot elevate someone to owner
  const newRole = orgRoles.find((r) => r.id === roleId);
  if (newRole?.name === "owner" && callerRole?.name !== "owner") {
    throw AppError.forbidden("Only the owner can assign the owner role");
  }

  // Validate the new roleId belongs to this org
  if (!newRole) {
    throw AppError.badRequest(
      "Invalid role — role does not belong to this organization",
    );
  }

  await OrganizationService.updateMemberRole(organization.id, userId, roleId);

  res.status(200).json({ success: true, message: "Member role updated" });
}
