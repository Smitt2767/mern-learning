import type { Request, Response } from "express";

import { SessionService } from "../../services/session.js";
import { Cookie } from "../../utils/cookie.js";
import { Jwt } from "../../utils/jwt.js";

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = Cookie.get(req, "refresh_token");

  if (refreshToken) {
    try {
      const payload = Jwt.verifyRefreshToken(refreshToken);
      await SessionService.deleteById(payload.sessionId, payload.userId);
    } catch {
      // Token is invalid or expired — still proceed with logout
    }
  }

  Cookie.delete(res, "access_token");
  Cookie.delete(res, "refresh_token", { path: "/api/auth" });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
