// MODIFIED — creates email verification token in tx and enqueues verify email after commit
import { ACCOUNT_PROVIDER, signupSchema } from "@mern/core";
import type { Request, Response } from "express";
import crypto from "node:crypto";

import { AppError, Cookie, Jwt, Password } from "@mern/server";
import { appConfig } from "../../config/app.js";
import { db } from "../../config/db.js";
import { emailQueue } from "../../queues/email.js";
import { AccountService } from "../../services/account.js";
import { EmailVerificationService } from "../../services/email-verification.js";
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
    const { sanitizedUser, accessToken, refreshToken, verificationToken } =
      await db.transaction(async (tx) => {
        // 1. Create user row
        const user = await UserService.create(
          {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: hashedPassword,
          },
          tx,
        );

        // 2. Create credentials account link
        await AccountService.create(
          {
            userId: user.id,
            provider: ACCOUNT_PROVIDER.CREDENTIALS,
            providerAccountId: user.id,
          },
          tx,
        );

        // 3. Generate email verification token (persisted in email_verifications)
        //    Done inside the tx so if anything fails the token is rolled back too.
        const verificationToken = await EmailVerificationService.createToken(
          user.id,
          tx,
        );

        // 4. Sign JWTs
        const accessToken = Jwt.signAccessToken({ userId: user.id, sessionId });
        const refreshToken = Jwt.signRefreshToken({
          userId: user.id,
          sessionId,
        });

        // 5. Persist session
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

        // 6. Set cookies
        Cookie.set(res, "access_token", accessToken, {
          maxAge: appConfig.auth.accessToken.maxAge,
        });
        Cookie.set(res, "refresh_token", refreshToken, {
          maxAge: appConfig.auth.refreshToken.maxAge,
        });

        const { password: _, ...sanitizedUser } = user;
        return { sanitizedUser, accessToken, refreshToken, verificationToken };
      });

    // ── Enqueue verification email ───────────────────────────────────────────
    // Done OUTSIDE the transaction intentionally:
    //   - The user + token exist in DB at this point (tx committed)
    //   - A queue failure here should NOT roll back the user account
    //   - BullMQ persists the job to Redis durably — if mail-server is down
    //     the job waits and is processed when it comes back up
    await emailQueue.add("send-verification-email", {
      userId: sanitizedUser.id,
      email: sanitizedUser.email,
      firstName: sanitizedUser.firstName,
      verificationToken,
    });

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
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
