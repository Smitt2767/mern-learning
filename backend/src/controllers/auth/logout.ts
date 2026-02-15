import type { Request, Response } from "express";

import { SessionService } from "../../services/session.js";
import { Cookie } from "../../utils/cookie.js";

export async function logout(req: Request, res: Response): Promise<void> {
  await SessionService.deleteById(req.sessionId!);

  Cookie.delete(res, "access_token");
  Cookie.delete(res, "refresh_token");

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
