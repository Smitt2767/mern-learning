import { JOB_NAME } from "@mern/core";
import { QueueManager } from "@mern/queue";
import { AppError } from "@mern/server";
import type { Request, Response } from "express";

import { env } from "@mern/env";
import { db } from "../../config/db.js";
import { EmailVerificationService } from "../../services/email-verification.js";
import { InvitationService } from "../../services/invitation.js";
import { UserService } from "../../services/user.js";

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query as Record<string, string>;

  if (!token) {
    return redirectWithError(res, "missing_token");
  }

  const record = await EmailVerificationService.findByToken(token);

  if (!record) {
    return redirectWithError(res, "invalid_or_expired_token");
  }

  const user = await UserService.findById(record.userId);
  if (!user) {
    throw AppError.internal("Orphaned email verification record");
  }

  await db.transaction(async (tx) => {
    await UserService.markEmailVerified(record.userId, tx);
    await EmailVerificationService.deleteByUserId(record.userId, tx);
  });

  void QueueManager.add(
    JOB_NAME.SEND_WELCOME_EMAIL,
    {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    },
    { priority: 10 },
  );

  // Auto-accept any pending org invitations for this email — fire-and-forget.
  // Runs after verification because only a verified user should be auto-joined.
  void InvitationService.autoAcceptPendingByEmail(user.email, user.id);

  res.redirect(`${env.FRONTEND_URL}/verify-email?success=true`);
}

function redirectWithError(res: Response, reason: string): void {
  res.redirect(`${env.FRONTEND_URL}/verify-email?error=${reason}`);
}
