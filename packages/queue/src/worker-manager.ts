import { HandlerMap, JobRegistry, WorkerHooks } from "@mern/core";
import { Logger } from "@mern/logger";
import { ConnectionOptions, Worker, type Job } from "bullmq";

export interface WorkerOptions {
  /** How many jobs to process concurrently. Default: 5. */
  concurrency?: number;
}

/**
 * WorkerManager<TRegistry>
 *
 * The CONSUMER side of the queue system.  Wraps a single BullMQ Worker
 * with full TypeScript type-safety.
 *
 * Key design decisions:
 *
 * 1. HandlerMap<TRegistry> is exhaustive — TypeScript enforces that EVERY
 *    job name in TRegistry has a handler.  Add a job to the registry and
 *    forget to add a handler → compile error.
 *
 * 2. The optional WorkerHooks let the CONSUMER attach lifecycle callbacks
 *    (e.g. writing to job_logs table) without @mern/queue having any
 *    dependency on @mern/database.  Clean separation of concerns.
 *
 * 3. Hook errors are swallowed — a failure in onJobStarted / onJobCompleted
 *    / onJobFailed must NEVER cause the job itself to be re-queued or marked
 *    failed.  Only handler errors trigger BullMQ retry logic.
 *
 * Usage (in mail-server):
 *   const emailWorker = new WorkerManager<EmailJobRegistry>(
 *     'email',
 *     redis,
 *     {
 *       'send-verification-email': async (job) => {
 *         await EmailService.sendVerificationEmail(job.data);
 *       },
 *       'send-welcome-email': async (job) => {
 *         await EmailService.sendWelcomeEmail(job.data);
 *       },
 *     },
 *     { concurrency: 10 },
 *     {
 *       onJobStarted:   (job) => JobLogService.onStarted(job, 'email'),
 *       onJobCompleted: (job) => JobLogService.onCompleted(job, 'email'),
 *       onJobFailed:    (job, err) => JobLogService.onFailed(job, err, 'email'),
 *     },
 *   );
 */
export class WorkerManager<TRegistry extends JobRegistry> {
  private readonly worker: Worker;
  readonly name: string;

  constructor(
    queueName: string,
    connection: ConnectionOptions,
    handlers: HandlerMap<TRegistry>,
    options: WorkerOptions = {},
    hooks: WorkerHooks = {},
  ) {
    this.name = queueName;

    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        const jobName = job.name as keyof TRegistry & string;
        const handler = handlers[jobName];

        // Safety net — in practice the type system prevents missing handlers,
        // but this guard protects against hand-crafted Redis payloads.
        if (!handler) {
          throw new Error(
            `[Worker:${this.name}] No handler registered for job: "${job.name}"`,
          );
        }

        // ── Hook: job started ──────────────────────────────────────────────
        await this.runHook("onJobStarted", () => hooks.onJobStarted?.(job));

        Logger.info(
          `[Worker:${this.name}] Processing — "${job.name}" (id: ${job.id}, attempt: ${job.attemptsMade + 1})`,
        );

        // ── Run the actual handler ─────────────────────────────────────────
        // Any error thrown here propagates to BullMQ, triggering retry logic.
        await handler(job as Job<TRegistry[typeof jobName]>);

        // ── Hook: job completed ────────────────────────────────────────────
        await this.runHook("onJobCompleted", () => hooks.onJobCompleted?.(job));

        Logger.success(
          `[Worker:${this.name}] Completed — "${job.name}" (id: ${job.id})`,
        );
      },
      {
        connection,
        concurrency: options.concurrency ?? 5,
      },
    );

    // BullMQ emits "failed" AFTER all retry attempts are exhausted
    this.worker.on("failed", async (job, err) => {
      Logger.error(
        `[Worker:${this.name}] Failed — "${job?.name}" (id: ${job?.id}): ${err.message}`,
      );

      if (job) {
        await this.runHook("onJobFailed", () => hooks.onJobFailed?.(job, err));
      }
    });

    this.worker.on("error", (err) => {
      Logger.error(`[Worker:${this.name}] Worker error:`, err);
    });

    Logger.info(
      `[Worker:${this.name}] Started (concurrency: ${options.concurrency ?? 5})`,
    );
  }

  /** Expose the raw BullMQ Worker if you need advanced operations. */
  getWorker(): Worker {
    return this.worker;
  }

  async close(): Promise<void> {
    await this.worker.close();
    Logger.info(`[Worker:${this.name}] Closed`);
  }

  /**
   * Run a lifecycle hook safely — errors are logged but never re-thrown.
   * This ensures hook failures cannot affect job retry/failure state.
   */
  private async runHook(
    hookName: string,
    fn: () => Promise<void> | undefined,
  ): Promise<void> {
    try {
      await fn();
    } catch (err) {
      Logger.error(
        `[Worker:${this.name}] Hook "${hookName}" threw an error (ignored):`,
        err,
      );
    }
  }
}
