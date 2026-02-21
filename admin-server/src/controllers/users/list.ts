import type { Request, Response } from "express";

import { z } from "zod";
import { UserService } from "../../services/user.js";

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit } = listUsersSchema.parse(req.query);
  const result = await UserService.findAll({ page, limit });
  res.status(200).json({ success: true, data: result });
}
