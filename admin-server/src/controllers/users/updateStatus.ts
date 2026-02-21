import type { Request, Response } from "express";

import { USER_STATUSES } from "@mern/core";
import { AppError } from "@mern/server";
import { z } from "zod";
import { UserService } from "../../services/user.js";

const updateStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
});

export async function updateUserStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = updateStatusSchema.parse(req.body);

  const user = await UserService.findById(id);
  if (!user) throw AppError.notFound("User not found");

  await UserService.updateStatus(id, status);

  res
    .status(200)
    .json({ success: true, message: "User status updated successfully" });
}
