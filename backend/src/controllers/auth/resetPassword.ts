import { resetPasswordSchema } from "@mern/core";
import type { Request, Response } from "express";

import { db } from "../../db/index.js";
import { PasswordResetService } from "../../services/password-reset.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";
import { AppError } from "../../utils/app-error.js";
import { Password } from "../../utils/password.js";

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const resetToken = await PasswordResetService.findByToken(token);
  if (!resetToken) {
    throw AppError.badRequest("Invalid or expired reset token");
  }

  const hashedPassword = await Password.hash(password);

  await db.transaction(async (tx) => {
    await UserService.updatePassword(resetToken.userId, hashedPassword, tx);
    await PasswordResetService.markAsUsed(resetToken.id, tx);
    await SessionService.deleteByUserId(resetToken.userId, tx);
  });

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully",
  });
}
