import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { RoleService } from "../../services/role.js";

export async function getRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const role = await RoleService.findById(id);
  if (!role) throw AppError.notFound("Role not found");
  res.status(200).json({ success: true, data: role });
}
