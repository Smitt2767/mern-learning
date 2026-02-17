import { JobRegistry } from "@mern/core";
import { Logger } from "@mern/logger";
import { ConnectionOptions, Queue, type JobsOptions } from "bullmq";

/**
 * QueueManager<TRegistry>
 *
 * The PRODUCER side of the queue system.  Wraps a single BullMQ Queue
 * with full TypeScript type-safety derived from the TRegistry generic.
 *
 * Usage (in auth-server):
 *   const emailQueue = new QueueManager<EmailJobRegistry>('email', redis);
 *
 *   // TypeScript knows the exact shape required for each job name:
 *   await emailQueue.add('send-verification-email', {
 *     userId, email, firstName, verificationToken,   // ← typed
 *   });
 *
 * The queue only adds jobs to Redis.  It has no knowledge of workers or
 * handlers — those live exclusively in mail-server.
 */
export class QueueManager<TRegistry extends JobRegistry> {
  private readonly queue: Queue;
  readonly name: string;

  constructor(queueName: string, connection: ConnectionOptions) {
    this.name = queueName;
    this.queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        // Retry up to 3 times with exponential back-off (1s, 2s, 4s)
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    });

    this.queue.on("error", (err) => {
      Logger.error(`[Queue:${this.name}] Error:`, err);
    });

    Logger.info(`[Queue:${this.name}] Initialized`);
  }

  /**
   * Add a job to the queue.
   *
   * Both `name` and `data` are fully type-safe:
   *   - `name` must be a key of TRegistry
   *   - `data` must match the payload type TRegistry[name]
   */
  async add<TName extends keyof TRegistry & string>(
    name: TName,
    data: TRegistry[TName],
    options?: JobsOptions,
  ) {
    const job = await this.queue.add(name, data, options);
    Logger.info(
      `[Queue:${this.name}] Job enqueued — "${name}" (id: ${job.id})`,
    );
    return job;
  }

  /**
   * Convenience wrapper for adding a delayed job.
   * Useful for: send a follow-up email 24h after signup, etc.
   */
  async addDelayed<TName extends keyof TRegistry & string>(
    name: TName,
    data: TRegistry[TName],
    delayMs: number,
    options?: Omit<JobsOptions, "delay">,
  ) {
    return this.add(name, data, { ...options, delay: delayMs });
  }

  /** Expose the raw BullMQ Queue if you need advanced operations. */
  getQueue(): Queue {
    return this.queue;
  }

  async close(): Promise<void> {
    await this.queue.close();
    Logger.info(`[Queue:${this.name}] Closed`);
  }
}
