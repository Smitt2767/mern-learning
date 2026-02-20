import { JOB_NAME, forgotPasswordSchema } from "@mern/core";
import { QueueManager } from "@mern/queue";
import type { Request, Response } from "express";

import { db } from "../../config/db.js";
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

  const { token, expiresAt } = await db.transaction(async (tx) => {
    await PasswordResetService.deleteByUserId(user.id, tx);
    return PasswordResetService.createToken(user.id, tx);
  });

  void QueueManager.add(JOB_NAME.SEND_PASSWORD_RESET_EMAIL, {
    userId: user.id,
    email,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  res.status(200).json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent",
  });
}
