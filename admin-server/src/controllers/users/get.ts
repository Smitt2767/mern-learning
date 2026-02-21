import type { Request, Response } from "express";

import { AppError } from "@mern/server";
import { UserService } from "../../services/user.js";

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const user = await UserService.findByIdForAdmin(id);
  if (!user) throw AppError.notFound("User not found");
  res.status(200).json({ success: true, data: user });
}
