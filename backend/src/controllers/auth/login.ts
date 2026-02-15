import { ACCOUNT_PROVIDER, USER_STATUS, loginSchema } from "@mern/shared";
import type { Request, Response } from "express";
import crypto from "node:crypto";

import { appConfig } from "../../config/app.js";
import { AccountService } from "../../services/account.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";
import { AppError } from "../../utils/app-error.js";
import { Cookie } from "../../utils/cookie.js";
import { Jwt } from "../../utils/jwt.js";
import { Password } from "../../utils/password.js";

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);

  const user = await UserService.findByEmail(input.email);
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const account = await AccountService.findByUserIdAndProvider(
    user.id,
    ACCOUNT_PROVIDER.CREDENTIALS,
  );

  if (!account || !user.password) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const isPasswordValid = await Password.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw AppError.forbidden("Your account has been suspended");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    await UserService.updateStatus(user.id, USER_STATUS.ACTIVE);
  }

  const sessionId = crypto.randomUUID();

  const accessToken = Jwt.signAccessToken({
    userId: user.id,
    sessionId,
  });

  const refreshToken = Jwt.signRefreshToken({
    userId: user.id,
    sessionId,
  });

  await SessionService.create({
    id: sessionId,
    userId: user.id,
    refreshToken,
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
    expiresAt: Jwt.getRefreshTokenExpiresAt(),
  });

  Cookie.set(res, "access_token", accessToken, {
    maxAge: appConfig.auth.accessToken.maxAge,
  });

  Cookie.set(res, "refresh_token", refreshToken, {
    maxAge: appConfig.auth.refreshToken.maxAge,
    path: "/api/auth",
  });

  const { password: _, ...sanitizedUser } = user;

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: { user: sanitizedUser, accessToken, refreshToken },
  });
}
