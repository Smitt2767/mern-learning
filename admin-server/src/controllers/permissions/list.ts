import type { Request, Response } from "express";

import { PermissionService } from "../../services/permission.js";

export async function listPermissions(
  _req: Request,
  res: Response,
): Promise<void> {
  const data = await PermissionService.findAll();
  res.status(200).json({ success: true, data });
}
