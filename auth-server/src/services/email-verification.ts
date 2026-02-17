import { emailVerifications, type DbInstance } from "@mern/database";
import { and, eq, gt } from "drizzle-orm";
import crypto from "node:crypto";
import { appConfig } from "../config/app.js";
import { db } from "../config/db.js";

/**
 * EmailVerificationService
 *
 * Data-access layer for the `email_verifications` table.
 * Follows the same static-method OOP pattern as PasswordResetService —
 * no business logic, pure DB interactions.
 *
 * Token lifecycle:
 *   1. createToken()  — called during signup (inside the tx)
 *   2. findByToken()  — called when the user clicks the link
 *   3. deleteByUserId() — called after successful verification (inside the tx)
 */
export class EmailVerificationService {
  private constructor() {}

  /**
   * Find a valid (non-expired) token record.
   * Returns undefined if the token doesn't exist or has expired.
   *
   * Note: no `usedAt` column on email_verifications — we delete the row
   * after use instead of marking it (keeps the table clean).
   */
  static async findByToken(token: string) {
    return db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.token, token),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    });
  }

  /**
   * Generate and insert a new verification token for a user.
   * Accepts an optional transaction so it can participate in the
   * signup transaction (user + account + token all in one atomic op).
   *
   * Returns the raw token string so the controller can pass it to the queue.
   */
  static async createToken(
    userId: string,
    tx: DbInstance = db,
  ): Promise<string> {
    // 32 random bytes → 64-char hex string — same approach as PasswordResetService
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = appConfig.auth.emailVerification.getExpiresAt();

    await tx.insert(emailVerifications).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Delete all pending verification tokens for a user.
   * Called after successful verification and also before creating a new token
   * on re-send (to avoid stale tokens accumulating).
   */
  static async deleteByUserId(
    userId: string,
    tx: DbInstance = db,
  ): Promise<void> {
    await tx
      .delete(emailVerifications)
      .where(eq(emailVerifications.userId, userId));
  }
}
