import { ACCOUNT_PROVIDER, signupSchema } from "@mern/core";
import type { Request, Response } from "express";
import crypto from "node:crypto";

import { AppError, Cookie, Jwt, Password } from "@mern/server";
import { appConfig } from "../../config/app.js";
import { db } from "../../config/db.js";
import { AccountService } from "../../services/account.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";

export async function signUp(req: Request, res: Response): Promise<void> {
  const input = signupSchema.parse(req.body);

  const existingUser = await UserService.findByEmail(input.email);
  if (existingUser) {
    throw AppError.badRequest("An account with this email already exists");
  }

  const hashedPassword = await Password.hash(input.password);
  const sessionId = crypto.randomUUID();

  try {
    const { sanitizedUser, accessToken, refreshToken } = await db.transaction(
      async (tx) => {
        const user = await UserService.create(
          {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: hashedPassword,
          },
          tx,
        );

        await AccountService.create(
          {
            userId: user.id,
            provider: ACCOUNT_PROVIDER.CREDENTIALS,
            providerAccountId: user.id,
          },
          tx,
        );

        const accessToken = Jwt.signAccessToken({
          userId: user.id,
          sessionId,
        });

        const refreshToken = Jwt.signRefreshToken({
          userId: user.id,
          sessionId,
        });

        await SessionService.create(
          {
            id: sessionId,
            userId: user.id,
            refreshToken,
            userAgent: req.headers["user-agent"] ?? null,
            ipAddress: req.ip ?? null,
            expiresAt: Jwt.getRefreshTokenExpiresAt(),
          },
          tx,
        );

        Cookie.set(res, "access_token", accessToken, {
          maxAge: appConfig.auth.accessToken.maxAge,
        });

        Cookie.set(res, "refresh_token", refreshToken, {
          maxAge: appConfig.auth.refreshToken.maxAge,
        });

        const { password: _, ...sanitizedUser } = user;

        return { sanitizedUser, accessToken, refreshToken };
      },
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user: sanitizedUser, accessToken, refreshToken },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as Record<string, unknown>).code === "23505"
    ) {
      throw AppError.badRequest("An account with this email already exists");
    }
    throw error;
  }
}
