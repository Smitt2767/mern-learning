import { USER_STATUS } from "@mern/shared";
import type { Request, Response } from "express";
import crypto from "node:crypto";

import { appConfig } from "../../config/app.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";
import { AppError } from "../../utils/app-error.js";
import { Cookie } from "../../utils/cookie.js";
import { Jwt } from "../../utils/jwt.js";

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken =
    Cookie.get(req, "refresh_token") ??
    (req.headers["x-refresh-token"] as string | undefined);
  if (!refreshToken) {
    throw AppError.unauthorized("No refresh token provided");
  }

  // Throws JsonWebTokenError / TokenExpiredError if tampered or expired
  const payload = Jwt.verifyRefreshToken(refreshToken);

  const session = await SessionService.findById(
    payload.userId,
    payload.sessionId,
  );

  // Session not found or DB-level expiry passed
  if (!session || session.expiresAt < new Date()) {
    Cookie.delete(res, "refresh_token");
    throw AppError.unauthorized("Session expired, please log in again");
  }

  // Stored token must match the one sent — detects refresh token reuse attacks
  if (session.refreshToken !== refreshToken) {
    // Potential token theft — nuke the entire session
    await SessionService.deleteById(session.id);
    Cookie.delete(res, "access_token");
    Cookie.delete(res, "refresh_token");
    throw AppError.unauthorized("Refresh token reuse detected");
  }

  const user = await UserService.findById(payload.userId);
  if (!user) {
    throw AppError.unauthorized();
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    await SessionService.deleteById(session.id);
    Cookie.delete(res, "access_token");
    Cookie.delete(res, "refresh_token");
    throw AppError.forbidden("Your account has been suspended");
  }

  // Rotate — new sessionId, new tokens, old session deleted atomically
  const newSessionId = crypto.randomUUID();

  const newAccessToken = Jwt.signAccessToken({
    userId: user.id,
    sessionId: newSessionId,
  });

  const newRefreshToken = Jwt.signRefreshToken({
    userId: user.id,
    sessionId: newSessionId,
  });

  await SessionService.rotate(session.id, {
    id: newSessionId,
    userId: user.id,
    refreshToken: newRefreshToken,
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
    expiresAt: Jwt.getRefreshTokenExpiresAt(),
  });

  Cookie.set(res, "access_token", newAccessToken, {
    maxAge: appConfig.auth.accessToken.maxAge,
  });

  Cookie.set(res, "refresh_token", newRefreshToken, {
    maxAge: appConfig.auth.refreshToken.maxAge,
  });

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: { accessToken: newAccessToken },
  });
}
