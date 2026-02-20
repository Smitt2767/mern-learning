import type { JobName } from "@mern/core";
import { Logger } from "@mern/logger";
import type { ConnectionOptions } from "bullmq";
import { Worker } from "bullmq";
import {
  DEFAULT_WORKER_OPTIONS,
  JOB_QUEUE_MAP,
  type QueueName,
} from "./constants/index.js";
import { JobRecordService } from "./services/job-record.js";
import type { WorkerHandlerMap } from "./types/index.js";

/**
 * WorkerManager
 *
 * Registers BullMQ workers and wires up DB persistence hooks automatically.
 * Workers are registered per-queue; each queue can handle multiple job names.
 *
 * Usage:
 * ```ts
 * WorkerManager.init(redisOptions);
 *
 * WorkerManager.register({
 *   [JOB_NAME.SEND_WELCOME_EMAIL]: async (job) => {
 *     const { email, firstName } = job.data; // fully typed
 *     await resend.emails.send({ to: email, subject: `Welcome ${firstName}!`, ... });
 *     return { messageId: "..." };
 *   },
 * });
 * ```
 */
export class WorkerManager {
  private static connection: ConnectionOptions;
  private static workers = new Map<QueueName, Worker>();
  private static handlers: WorkerHandlerMap = {};
  private static initialised = false;

  private constructor() {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  static init(connection: ConnectionOptions): void {
    if (WorkerManager.initialised) {
      Logger.warn("WorkerManager.init() called more than once — ignoring.");
      return;
    }

    WorkerManager.connection = connection;
    WorkerManager.initialised = true;
    Logger.success("WorkerManager initialised.");
  }

  // ─── Handler registration ─────────────────────────────────────────────────

  /**
   * Register processor functions for one or more job names.
   * Calling register() will spin up a Worker for every queue that has
   * at least one handler registered.
   *
   * You can call register() multiple times (e.g. across feature modules)
   * before the workers start processing.
   */
  static register(handlers: WorkerHandlerMap): void {
    WorkerManager.assertInitialised();

    // Merge new handlers into the global map
    Object.assign(WorkerManager.handlers, handlers);

    // Determine which queues now have handlers
    const affectedQueues = new Set<QueueName>();
    for (const jobName of Object.keys(handlers) as JobName[]) {
      affectedQueues.add(JOB_QUEUE_MAP[jobName]);
    }

    // (Re-)create workers for affected queues
    for (const queueName of affectedQueues) {
      WorkerManager.startWorker(queueName);
    }
  }

  // ─── Internal: worker creation ────────────────────────────────────────────

  private static startWorker(queueName: QueueName): void {
    // Tear down the existing worker for this queue before replacing it
    if (WorkerManager.workers.has(queueName)) {
      void WorkerManager.workers.get(queueName)!.close();
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        const jobName = job.name as JobName;
        const handler = WorkerManager.handlers[jobName];

        if (!handler) {
          throw new Error(
            `No handler registered for job "${jobName}" in queue "${queueName}".`,
          );
        }

        // Mark as active in DB
        await JobRecordService.markActive(job.id!, job.attemptsMade);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (handler as any)(job);
      },
      {
        ...DEFAULT_WORKER_OPTIONS,
        connection: WorkerManager.connection,
      },
    );

    // ── Event hooks → DB persistence ────────────────────────────────────────

    worker.on("completed", async (job, result) => {
      Logger.info(`Job "${job.name}" (id: ${job.id}) completed.`);
      await JobRecordService.markCompleted(job.id!, result);
    });

    worker.on("failed", async (job, err) => {
      if (!job) return;
      Logger.error(`Job "${job.name}" (id: ${job.id}) failed: ${err.message}`);
      await JobRecordService.markFailed(
        job.id!,
        job.attemptsMade,
        err.message,
        err.stack,
      );
    });

    worker.on("error", (err) => {
      Logger.error(
        `Worker for queue "${queueName}" emitted error:`,
        err.message,
      );
    });

    WorkerManager.workers.set(queueName, worker);
    Logger.debug(`Worker started for queue "${queueName}".`);
  }

  // ─── Graceful shutdown ─────────────────────────────────────────────────────

  static async close(): Promise<void> {
    await Promise.all(
      [...WorkerManager.workers.values()].map((w) => w.close()),
    );
    WorkerManager.workers.clear();
    Logger.info("All workers closed.");
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private static assertInitialised(): void {
    if (!WorkerManager.initialised) {
      throw new Error(
        "WorkerManager.init() must be called before using WorkerManager.",
      );
    }
  }
}
