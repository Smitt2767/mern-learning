import type { Request, Response } from "express";

import { z } from "zod";
import { RoleService } from "../../services/role.js";

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
});

export async function createRole(req: Request, res: Response): Promise<void> {
  const input = createRoleSchema.parse(req.body);
  const role = await RoleService.create(input);
  res.status(201).json({ success: true, data: role });
}
