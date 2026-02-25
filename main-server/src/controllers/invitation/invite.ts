import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { z } from "zod";
import { InvitationService } from "../../services/invitation.js";
import { OrganizationService } from "../../services/organization.js";

const schema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});

export async function invite(req: Request, res: Response): Promise<void> {
  const { email, roleId } = schema.parse(req.body);
  const { organization } = req.organizationMember!;

  // Validate roleId belongs to this org
  const orgRoles = await OrganizationService.findOrgRoles(organization.id);
  const roleExists = orgRoles.some((r) => r.id === roleId);
  if (!roleExists) {
    throw AppError.badRequest(
      "Invalid role — role does not belong to this organization",
    );
  }

  const invitation = await InvitationService.create(
    organization.id,
    req.user!.id,
    email,
    roleId,
  );

  res.status(201).json({ success: true, data: { invitation } });
}
