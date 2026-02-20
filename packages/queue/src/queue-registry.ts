import type { DbInstance } from "@mern/database";
import { Logger } from "@mern/logger";
import type { ConnectionOptions } from "bullmq";
import { QueueManager } from "./queue-manager.js";
import { Scheduler } from "./scheduler.js";
import { JobRecordService } from "./services/job-record.js";
import { WorkerManager } from "./worker-manager.js";

export interface QueueRegistryOptions {
  /** ioredis connection options — passed to all BullMQ internals. */
  connection: ConnectionOptions;
  /** Drizzle DB instance for job record persistence. */
  db: DbInstance;
  /**
   * Whether to spin up workers on this process.
   * Set to `false` on API-only servers that only enqueue jobs.
   */
  enableWorkers?: boolean;
  /**
   * Whether to enable the cron scheduler on this process.
   * Only one process in your cluster should have this set to `true`.
   */
  enableScheduler?: boolean;
}

/**
 * QueueRegistry
 *
 * The single bootstrap entry-point for the entire queue subsystem.
 * Call `QueueRegistry.init()` once in your server startup sequence.
 *
 * ```ts
 * // In your server.ts configure() method:
 * QueueRegistry.init({
 *   connection: redisOptions,
 *   db: database.db,
 *   enableWorkers: true,
 *   enableScheduler: true,
 * });
 * ```
 */
export class QueueRegistry {
  private static initialised = false;

  private constructor() {}

  static init(options: QueueRegistryOptions): void {
    if (QueueRegistry.initialised) {
      Logger.warn("QueueRegistry.init() called more than once — ignoring.");
      return;
    }

    const {
      connection,
      db,
      enableWorkers = true,
      enableScheduler = false,
    } = options;

    // Always initialise QueueManager (needed for enqueuing)
    QueueManager.init(connection);

    // Always initialise JobRecordService (needed by workers + manual tracking)
    JobRecordService.init(db);

    if (enableWorkers) {
      WorkerManager.init(connection);
    }

    if (enableScheduler) {
      Scheduler.init(connection);
    }

    QueueRegistry.initialised = true;

    Logger.success(
      `QueueRegistry initialised [workers: ${enableWorkers}, scheduler: ${enableScheduler}].`,
    );
  }

  /** Gracefully close all queues, workers and scheduler connections. */
  static async shutdown(): Promise<void> {
    await Promise.all([
      QueueManager.close(),
      WorkerManager.close(),
      Scheduler.close(),
    ]);
    Logger.info("QueueRegistry shutdown complete.");
  }
}
