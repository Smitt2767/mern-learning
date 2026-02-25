import type { Request, Response } from "express";
import { InvitationService } from "../../services/invitation.js";

export async function acceptInvitation(
  req: Request,
  res: Response,
): Promise<void> {
  const { token } = req.params as { token: string };

  await InvitationService.accept(token, req.user!.id);

  res.status(200).json({ success: true, message: "Invitation accepted" });
}
