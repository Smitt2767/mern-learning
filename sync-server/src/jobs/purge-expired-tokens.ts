import { JOB_NAME } from "@mern/core";
import { emailVerifications, passwordResetTokens } from "@mern/database";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";
import { lt } from "drizzle-orm";
import { db } from "../config/db.js";

/**
 * purgeExpiredTokens
 *
 * Deletes all expired rows from:
 *  - `email_verifications`  — rows whose `expires_at` is in the past
 *  - `password_reset_tokens` — rows whose `expires_at` is in the past
 *
 * Both tables are purged in a single transaction.
 * Scheduled nightly via BullMQ cron — midnight UTC.
 *
 * Returns `{ deletedCount }` (combined total) stored in `job_records.result`.
 */
export const purgeExpiredTokens: TypedProcessor<
  typeof JOB_NAME.PURGE_EXPIRED_TOKENS
> = async (_job) => {
  Logger.info("[sync] Running purge-expired-tokens…");

  const now = new Date();

  const [deletedVerifications, deletedResets] = await db.transaction(
    async (tx) => {
      const ev = await tx
        .delete(emailVerifications)
        .where(lt(emailVerifications.expiresAt, now))
        .returning({ id: emailVerifications.id });

      const pr = await tx
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, now))
        .returning({ id: passwordResetTokens.id });

      return [ev, pr] as const;
    },
  );

  const deletedCount =
    (deletedVerifications?.length ?? 0) + (deletedResets?.length ?? 0);

  Logger.success(
    `[sync] purge-expired-tokens complete — ${deletedCount} row(s) removed ` +
      `(emailVerifications: ${deletedVerifications?.length ?? 0}, passwordResetTokens: ${deletedResets?.length ?? 0}).`,
  );

  return { deletedCount };
};
