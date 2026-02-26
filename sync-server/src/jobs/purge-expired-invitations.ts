import { JOB_NAME } from "@mern/core";
import { organizationInvitations } from "@mern/database";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";
import { lt } from "drizzle-orm";

import { db } from "../config/db.js";

/**
 * purgeExpiredInvitations
 *
 * Hard-deletes all invitation rows whose `expiresAt` is in the past,
 * regardless of status. Consistent with the approach used by
 * purgeExpiredSessions and purgeExpiredTokens.
 *
 * Scheduled nightly via BullMQ cron — midnight UTC.
 * Returns `{ deletedCount }` stored in `job_records.result`.
 */
export const purgeExpiredInvitations: TypedProcessor<
  typeof JOB_NAME.PURGE_EXPIRED_INVITATIONS
> = async (_job) => {
  Logger.info("[sync] Running purge-expired-invitations…");

  const now = new Date();

  const deleted = await db
    .delete(organizationInvitations)
    .where(lt(organizationInvitations.expiresAt, now))
    .returning({ id: organizationInvitations.id });

  const deletedCount = deleted.length;

  Logger.success(
    `[sync] purge-expired-invitations complete — ${deletedCount} invitation(s) deleted.`,
  );

  return { deletedCount };
};
