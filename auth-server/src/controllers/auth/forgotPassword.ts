import { forgotPasswordSchema } from "@mern/core";
import type { Request, Response } from "express";

import { db } from "../../config/db.js";
import { env } from "../../config/env.js";
import { PasswordResetService } from "../../services/password-reset.js";
import { UserService } from "../../services/user.js";

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await UserService.findByEmail(email);

  // Always return success to prevent email enumeration
  if (!user || !user.password) {
    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
    return;
  }

  const token = await db.transaction(async (tx) => {
    await PasswordResetService.deleteByUserId(user.id, tx);
    return PasswordResetService.createToken(user.id, tx);
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  // TODO: Replace with email service
  console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);

  res.status(200).json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent",
  });
}
