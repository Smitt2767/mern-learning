import { USER_STATUS } from "@mern/core";
import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "@mern/server";
import { db } from "../../config/db.js";
import { emailQueue } from "../../queues/email.js";
import { EmailVerificationService } from "../../services/email-verification.js";
import { UserService } from "../../services/user.js";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

/**
 * GET /api/auth/verify-email?token=<hex>
 *
 * Called when the user clicks the link in their verification email.
 * The frontend redirects the user here (or calls this endpoint directly
 * from a /verify-email page after extracting the token from the URL).
 *
 * Flow:
 *   1. Validate token exists in DB and hasn't expired
 *   2. Mark user's emailVerifiedAt + delete token (atomic tx)
 *   3. Activate user if they were still 'inactive'
 *   4. Enqueue welcome email (outside tx — fire-and-forget)
 *   5. Return success
 *
 * Idempotent: if the email is already verified we return 200 immediately.
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = verifyEmailSchema.parse(req.query);

  // Step 1: Look up the token
  const record = await EmailVerificationService.findByToken(token);
  if (!record) {
    throw AppError.badRequest("Invalid or expired verification token");
  }

  // Step 2: Load the user
  const user = await UserService.findById(record.userId);
  if (!user) {
    // Defensive — shouldn't happen due to FK cascade, but worth handling
    throw AppError.notFound("User not found");
  }

  // Idempotency guard — if already verified, short-circuit with success
  if (user.emailVerifiedAt) {
    res.status(200).json({
      success: true,
      message: "Email is already verified",
    });
    return;
  }

  // Step 3: Mark verified + clean up token (atomic)
  await db.transaction(async (tx) => {
    await UserService.markEmailVerified(user.id, tx);
    await EmailVerificationService.deleteByUserId(user.id, tx);

    // If the user was in 'inactive' state (e.g. self-deactivated then re-registered),
    // bring them back to 'active' on verification
    if (user.status === USER_STATUS.INACTIVE) {
      await UserService.updateStatus(user.id, USER_STATUS.ACTIVE, tx);
    }
  });

  // Step 4: Enqueue welcome email — outside tx (same reasoning as signup.ts)
  await emailQueue.add("send-welcome-email", {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
  });

  // Step 5: Respond
  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
}
