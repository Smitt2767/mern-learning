import type { JobDataMap, JobName } from "@mern/core";
import { Logger } from "@mern/logger";
import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";
import { DEFAULT_QUEUE_OPTIONS, JOB_QUEUE_MAP } from "./constants/index.js";
import type { CronJobDefinition } from "./types/index.js";

/**
 * Scheduler
 *
 * Manages repeatable / cron jobs via BullMQ's built-in repeat support.
 * Uses a dedicated Queue per logical queue name (shared with QueueManager
 * through the same Redis keyspace, just a different client handle).
 *
 * Usage:
 * ```ts
 * Scheduler.init(redisOptions);
 *
 * await Scheduler.addCron({
 *   name: "Nightly session purge",
 *   jobName: JOB_NAME.PURGE_EXPIRED_SESSIONS,
 *   data: {},
 *   cron: "0 3 * * *",  // 3 AM every day
 *   tz: "UTC",
 * });
 * ```
 */
export class Scheduler {
  private static connection: ConnectionOptions;
  private static queues = new Map<string, Queue>();
  private static initialised = false;

  private constructor() {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  static init(connection: ConnectionOptions): void {
    if (Scheduler.initialised) {
      Logger.warn("Scheduler.init() called more than once — ignoring.");
      return;
    }

    Scheduler.connection = connection;
    Scheduler.initialised = true;
    Logger.success("Scheduler initialised.");
  }

  // ─── Cron management ──────────────────────────────────────────────────────

  /**
   * Schedule a repeating cron job.
   * If a repeat job with the same jobName + cron already exists it is
   * replaced, preventing duplicates across server restarts.
   */
  static async addCron<N extends JobName>(
    definition: CronJobDefinition<N>,
  ): Promise<void> {
    Scheduler.assertInitialised();

    const { name, jobName, data, cron, tz, options } = definition;
    const queueName = JOB_QUEUE_MAP[jobName];
    const queue = Scheduler.getQueue(queueName);

    await queue.add(jobName, data as JobDataMap[N], {
      ...options,
      repeat: {
        pattern: cron,
        ...(tz ? { tz } : {}),
      },
    });

    Logger.info(`Cron job "${name}" (${jobName}) scheduled: "${cron}".`);
  }

  /**
   * Remove a repeating cron job by job name + cron expression.
   */
  static async removeCron<N extends JobName>(
    jobName: N,
    cron: string,
  ): Promise<void> {
    Scheduler.assertInitialised();

    const queueName = JOB_QUEUE_MAP[jobName];
    const queue = Scheduler.getQueue(queueName);

    const removed = await queue.removeRepeatable(jobName, { pattern: cron });

    if (removed) {
      Logger.info(`Cron job "${jobName}" (${cron}) removed.`);
    } else {
      Logger.warn(
        `Cron job "${jobName}" (${cron}) not found — nothing removed.`,
      );
    }
  }

  /**
   * List all active repeatable jobs across all queues.
   */
  static async listCronJobs(): Promise<
    Array<{
      queueName: string;
      key: string;
      name: string;
      cron: string | undefined;
    }>
  > {
    Scheduler.assertInitialised();

    const results = [];

    for (const [queueName, queue] of Scheduler.queues.entries()) {
      const repeatables = await queue.getRepeatableJobs();
      for (const job of repeatables) {
        results.push({
          queueName,
          key: job.key,
          name: job.name,
          cron: job.pattern ?? undefined,
        });
      }
    }

    return results;
  }

  // ─── Graceful shutdown ─────────────────────────────────────────────────────

  static async close(): Promise<void> {
    await Promise.all([...Scheduler.queues.values()].map((q) => q.close()));
    Scheduler.queues.clear();
    Logger.info("Scheduler closed.");
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private static getQueue(name: string): Queue {
    if (!Scheduler.queues.has(name)) {
      const queue = new Queue(name, {
        ...DEFAULT_QUEUE_OPTIONS,
        connection: Scheduler.connection,
      });
      queue.on("error", (err) => {
        Logger.error(`Scheduler queue "${name}" error:`, err.message);
      });
      Scheduler.queues.set(name, queue);
    }
    return Scheduler.queues.get(name)!;
  }

  private static assertInitialised(): void {
    if (!Scheduler.initialised) {
      throw new Error(
        "Scheduler.init() must be called before using Scheduler.",
      );
    }
  }
}
