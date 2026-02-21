import type { Request, Response } from "express";

import { RoleService } from "../../services/role.js";

export async function deleteRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await RoleService.delete(id);
  res.status(204).send();
}
