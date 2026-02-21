import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { z } from "zod";
import { RoleService } from "../../services/role.js";

const updateRoleSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine((d) => d.name !== undefined || d.description !== undefined, {
    message: "At least one field (name or description) must be provided",
  });

export async function updateRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const input = updateRoleSchema.parse(req.body);

  await RoleService.update(id, input);

  const updated = await RoleService.findById(id);
  if (!updated) throw AppError.notFound("Role not found");

  res.status(200).json({ success: true, data: updated });
}
