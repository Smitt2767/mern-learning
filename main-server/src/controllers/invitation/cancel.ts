import type { Request, Response } from "express";
import { InvitationService } from "../../services/invitation.js";

export async function cancelInvitation(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as { id: string };

  await InvitationService.cancel(id);

  res.status(200).json({ success: true, message: "Invitation cancelled" });
}
