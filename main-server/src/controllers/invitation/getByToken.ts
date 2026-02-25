import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { InvitationService } from "../../services/invitation.js";

export async function getInvitationByToken(
  req: Request,
  res: Response,
): Promise<void> {
  const { token } = req.params as { token: string };

  const invitation = await InvitationService.findByToken(token);
  if (!invitation) throw AppError.notFound("Invitation not found");

  // Strip the token from the public response — it's in the URL already
  const { token: _, ...safeInvitation } = invitation;

  res.status(200).json({ success: true, data: { invitation: safeInvitation } });
}
