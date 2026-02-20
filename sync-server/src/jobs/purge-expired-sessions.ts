import { JOB_NAME } from "@mern/core";
import { sessions } from "@mern/database";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";
import { lt } from "drizzle-orm";
import { db } from "../config/db.js";

/**
 * purgeExpiredSessions
 *
 * Deletes all session rows whose `expires_at` is in the past.
 * Scheduled nightly via BullMQ cron — midnight UTC.
 *
 * Returns `{ deletedCount }` which is stored in `job_records.result`.
 */
export const purgeExpiredSessions: TypedProcessor<
  typeof JOB_NAME.PURGE_EXPIRED_SESSIONS
> = async (_job) => {
  Logger.info("[sync] Running purge-expired-sessions…");

  const now = new Date();

  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  const deletedCount = deleted.length;

  Logger.success(
    `[sync] purge-expired-sessions complete — ${deletedCount} row(s) removed.`,
  );

  return { deletedCount };
};
