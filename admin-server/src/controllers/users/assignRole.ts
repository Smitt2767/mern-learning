import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { z } from "zod";
import { UserService } from "../../services/user.js";

const assignRoleSchema = z.object({
  roleId: z.uuid().nullable(),
});

export async function assignRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { roleId } = assignRoleSchema.parse(req.body);

  const user = await UserService.findById(id);
  if (!user) throw AppError.notFound("User not found");

  await UserService.assignRole(id, roleId);

  res
    .status(200)
    .json({ success: true, message: "Role assigned successfully" });
}
