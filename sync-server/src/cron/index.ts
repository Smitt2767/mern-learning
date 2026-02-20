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

/**
 * registerSyncCronJobs
 *
 * Schedules all nightly maintenance cron jobs via the BullMQ Scheduler.
 * Must be called after `QueueRegistry.init({ enableScheduler: true })`.
 *
 * BullMQ deduplicates repeatable jobs by (jobName + cron pattern), so
 * restarting the sync-server will NOT create duplicate schedules.
 */
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

  Logger.success("[sync] Cron jobs registered.");
}
