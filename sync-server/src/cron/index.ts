import { JOB_NAME } from "@mern/core";
import { Logger } from "@mern/logger";
import { Scheduler } from "@mern/queue";

/**
 * Cron expression for midnight UTC every day.
 *
 *  ┌──────── minute   (0)
 *  │ ┌────── hour     (0)
 *  │ │ ┌──── day/month (*)
 *  │ │ │ ┌── month     (*)
 *  │ │ │ │ ┌ day/week  (*)
 *  0 0 * * *
 */
const MIDNIGHT_UTC = "0 0 * * *";

export async function registerSyncCronJobs(): Promise<void> {
  Logger.info("[sync] Registering cron jobs…");

  await Scheduler.addCron({
    name: "Nightly — Purge expired sessions",
    jobName: JOB_NAME.PURGE_EXPIRED_SESSIONS,
    data: {},
    cron: MIDNIGHT_UTC,
    tz: "UTC",
  });

  await Scheduler.addCron({
    name: "Nightly — Purge expired tokens",
    jobName: JOB_NAME.PURGE_EXPIRED_TOKENS,
    data: {},
    cron: MIDNIGHT_UTC,
    tz: "UTC",
  });

  await Scheduler.addCron({
    name: "Nightly — Purge expired invitations",
    jobName: JOB_NAME.PURGE_EXPIRED_INVITATIONS,
    data: {},
    cron: MIDNIGHT_UTC,
    tz: "UTC",
  });

  Logger.success("[sync] Cron jobs registered.");
}
