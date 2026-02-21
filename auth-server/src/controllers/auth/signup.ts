import { ACCOUNT_PROVIDER, JOB_NAME, signupSchema } from "@mern/core";
import { QueueManager } from "@mern/queue";
import type { Request, Response } from "express";

import { AppError, Password } from "@mern/server";
import { db } from "../../config/db.js";
import { AccountService } from "../../services/account.js";
import { EmailVerificationService } from "../../services/email-verification.js";
import { UserService } from "../../services/user.js";

export async function signUp(req: Request, res: Response): Promise<void> {
  const input = signupSchema.parse(req.body);

  const existingUser = await UserService.findByEmail(input.email);
  if (existingUser) {
    throw AppError.badRequest("An account with this email already exists");
  }

  const hashedPassword = await Password.hash(input.password);

  try {
    const { user, token, expiresAt } = await db.transaction(async (tx) => {
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

      const { token, expiresAt } =
        await EmailVerificationService.createToken(user.id, tx);

      return { user, token, expiresAt };
    });

    void QueueManager.add(
      JOB_NAME.SEND_EMAIL_VERIFICATION,
      {
        userId: user.id,
        email: user.email,
        token,
        expiresAt: expiresAt.toISOString(),
      },
      { priority: 1 },
    );

    const { password: _, ...sanitizedUser } = user;

    res.status(201).json({
      success: true,
      message:
        "Account created. Please check your email to verify your account.",
      data: { user: sanitizedUser },
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
