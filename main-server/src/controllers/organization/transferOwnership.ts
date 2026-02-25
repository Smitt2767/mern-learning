import { AppError } from "@mern/server";
import type { Request, Response } from "express";
import { z } from "zod";
import { OrganizationService } from "../../services/organization.js";

const schema = z.object({
  userId: z.string().uuid(),
});

export async function transferOwnership(
  req: Request,
  res: Response,
): Promise<void> {
  const { toUserId } = schema
    .transform((d) => ({ toUserId: d.userId }))
    .parse(req.body);

  const { organization, member } = req.organizationMember!;

  if (toUserId === member.userId) {
    throw AppError.badRequest("You are already the owner");
  }

  const targetMember = await OrganizationService.findMember(
    organization.id,
    toUserId,
  );
  if (!targetMember)
    throw AppError.notFound("Target user is not a member of this organization");

  await OrganizationService.transferOwnership(
    organization.id,
    member.userId,
    toUserId,
  );

  res.status(200).json({ success: true, message: "Ownership transferred" });
}
