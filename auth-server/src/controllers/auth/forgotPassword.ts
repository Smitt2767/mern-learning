// MODIFIED — replaced console.log TODO with emailQueue.add
import { forgotPasswordSchema } from "@mern/core";
import type { Request, Response } from "express";

import { db } from "../../config/db.js";
import { emailQueue } from "../../queues/email.js";
import { PasswordResetService } from "../../services/password-reset.js";
import { UserService } from "../../services/user.js";

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await UserService.findByEmail(email);

  // Always return the same success response to prevent email enumeration.
  // An attacker cannot tell whether the email exists in our DB.
  if (!user || !user.password) {
    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
    return;
  }

  const token = await db.transaction(async (tx) => {
    // Delete any existing (potentially stale) tokens first
    await PasswordResetService.deleteByUserId(user.id, tx);
    return PasswordResetService.createToken(user.id, tx);
  });

  // Enqueue password reset email — replaces the console.log TODO
  // Fire-and-forget: a queue failure doesn't block the 200 response
  await emailQueue.add("send-password-reset-email", {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    resetToken: token,
  });

  res.status(200).json({
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent",
  });
}
