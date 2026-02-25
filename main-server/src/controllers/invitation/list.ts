import type { Request, Response } from "express";
import { InvitationService } from "../../services/invitation.js";

export async function listInvitations(
  req: Request,
  res: Response,
): Promise<void> {
  const { organization } = req.organizationMember!;

  const invitations = await InvitationService.findAllByOrg(organization.id);

  res.status(200).json({ success: true, data: { invitations } });
}
