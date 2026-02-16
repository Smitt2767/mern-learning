import type { Request, Response } from "express";

export async function profile(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
}
