import type { Request, Response } from "express";

import { RoleService } from "../../services/role.js";

export async function listRoles(_req: Request, res: Response): Promise<void> {
  const data = await RoleService.findAll();
  res.status(200).json({ success: true, data });
}
