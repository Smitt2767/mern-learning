import { changePasswordSchema } from "@mern/shared";
import type { Request, Response } from "express";

import { db } from "../../db/index.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";
import { AppError } from "../../utils/app-error.js";
import { Cookie } from "../../utils/cookie.js";
import { Password } from "../../utils/password.js";

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { currentPassword, newPassword } = changePasswordSchema.parse(
    req.body,
  );

  const user = await UserService.findByEmail(req.user!.email);
  if (!user) {
    throw AppError.unauthorized();
  }

  if (!user.password) {
    throw AppError.badRequest(
      "OAuth accounts cannot change password. Please use your OAuth provider.",
    );
  }

  const isValid = await Password.compare(currentPassword, user.password);
  if (!isValid) {
    throw AppError.badRequest("Current password is incorrect");
  }

  const hashedPassword = await Password.hash(newPassword);

  await db.transaction(async (tx) => {
    await UserService.updatePassword(user.id, hashedPassword, tx);
    await SessionService.deleteByUserId(user.id, tx);
  });

  Cookie.delete(res, "access_token");
  Cookie.delete(res, "refresh_token");

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please log in again.",
  });
}
