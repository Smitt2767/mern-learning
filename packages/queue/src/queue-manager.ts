import type { JobDataMap, JobName, JobResultMap } from "@mern/core";
import { Logger } from "@mern/logger";
import type { ConnectionOptions } from "bullmq";
import { Queue, type BulkJobOptions, type Job } from "bullmq";
import {
  DEFAULT_QUEUE_OPTIONS,
  JOB_QUEUE_MAP,
  type QueueName,
} from "./constants/index.js";
import type { AddJobOptions } from "./types/index.js";

/**
 * Why Queue<unknown, unknown>?
 * ─────────────────────────────────────────────────────────────────────────────
 * BullMQ types Queue.add() as:
 *   add(name: ExtractNameType<DataType, string>, data: DataType, ...)
 *
 * ExtractNameType is a conditional: if DataType has a literal `name` field it
 * extracts it, otherwise it falls back to `string`.
 *
 * When Queue is generified with JobDataMap[N] (N still unresolved), TypeScript
 * cannot evaluate the conditional — it stays deferred and `jobName: N` won't
 * satisfy it even though N extends string.
 *
 * Storing Queue<unknown, unknown> forces ExtractNameType<unknown, string> →
 * plain `string` immediately, unblocking the call. All caller-facing type
 * safety lives on the public add<N> / addBulk<N> signatures instead, which
 * is the only surface consumers ever see.
 */
type AnyQueue = Queue<unknown, unknown>;

/**
 * BullMQ's addBulk item has `opts?: BulkJobOptions` (never undefined).
 * With exactOptionalPropertyTypes we cannot pass `opts: undefined` explicitly —
 * the property must be entirely absent when there are no options.
 * This helper builds the item correctly in both cases.
 */
function toBulkItem(
  name: string,
  data: unknown,
  options: AddJobOptions | undefined,
): { name: string; data: unknown; opts?: BulkJobOptions } {
  if (options !== undefined) {
    return { name, data, opts: options };
  }
  return { name, data };
}

export class QueueManager {
  private static connection: ConnectionOptions;
  private static queues = new Map<QueueName, AnyQueue>();
  private static initialised = false;

  private constructor() {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  static init(connection: ConnectionOptions): void {
    if (QueueManager.initialised) {
      Logger.warn("QueueManager.init() called more than once — ignoring.");
      return;
    }
    QueueManager.connection = connection;
    QueueManager.initialised = true;
    Logger.success("QueueManager initialised.");
  }

  // ─── Add jobs ──────────────────────────────────────────────────────────────

  /**
   * Enqueue a job.
   *
   * Type-safe end-to-end: `data` is inferred from `jobName` via JobDataMap.
   * TypeScript will error at the call site if the payload shape is wrong.
   *
   * @example
   * await QueueManager.add(JOB_NAME.SEND_WELCOME_EMAIL, {
   *   userId: "...", email: "...", firstName: "...",
   * });
   */
  static async add<N extends JobName>(
    jobName: N,
    data: JobDataMap[N],
    options?: AddJobOptions,
  ): Promise<Job<JobDataMap[N], JobResultMap[N]>> {
    const queue = QueueManager.forJob(jobName);
    const job = await queue.add(jobName, data, options);
    Logger.debug(
      `Job "${jobName}" added to queue "${JOB_QUEUE_MAP[jobName]}" (id: ${job.id}).`,
    );
    // Queue<unknown, unknown> internally — public signature guarantees the
    // correct D/R shape, so narrowing here is sound.
    return job as Job<JobDataMap[N], JobResultMap[N]>;
  }

  /**
   * Add multiple jobs of the same type in a single Redis round-trip.
   */
  static async addBulk<N extends JobName>(
    jobName: N,
    items: Array<{ data: JobDataMap[N]; options?: AddJobOptions }>,
  ): Promise<Array<Job<JobDataMap[N], JobResultMap[N]>>> {
    const queue = QueueManager.forJob(jobName);

    // toBulkItem handles two exactOptionalPropertyTypes concerns:
    //  1. Casts `data` to `unknown`  — satisfies Queue<unknown, unknown>.addBulk()
    //  2. Omits `opts` entirely when undefined — satisfies BulkJobOptions constraint
    const jobs = await queue.addBulk(
      items.map(({ data, options }) => toBulkItem(jobName, data, options)),
    );

    Logger.debug(
      `${jobs.length} "${jobName}" jobs added to queue "${JOB_QUEUE_MAP[jobName]}".`,
    );
    return jobs as Array<Job<JobDataMap[N], JobResultMap[N]>>;
  }

  // ─── Queue control ─────────────────────────────────────────────────────────

  static async pauseQueue(name: QueueName): Promise<void> {
    await QueueManager.getQueue(name).pause();
    Logger.info(`Queue "${name}" paused.`);
  }

  static async resumeQueue(name: QueueName): Promise<void> {
    await QueueManager.getQueue(name).resume();
    Logger.info(`Queue "${name}" resumed.`);
  }

  static async drainQueue(name: QueueName): Promise<void> {
    await QueueManager.getQueue(name).drain();
    Logger.info(`Queue "${name}" drained.`);
  }

  // ─── Graceful shutdown ─────────────────────────────────────────────────────

  static async close(): Promise<void> {
    await Promise.all([...QueueManager.queues.values()].map((q) => q.close()));
    QueueManager.queues.clear();
    Logger.info("All queues closed.");
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  /** Resolve the correct queue for a given job name. */
  private static forJob(jobName: JobName): AnyQueue {
    return QueueManager.getQueue(JOB_QUEUE_MAP[jobName]);
  }

  /** Lazily create and cache a Queue instance by queue name. */
  private static getQueue(name: QueueName): AnyQueue {
    QueueManager.assertInitialised();

    if (!QueueManager.queues.has(name)) {
      const queue: AnyQueue = new Queue(name, {
        ...DEFAULT_QUEUE_OPTIONS,
        connection: QueueManager.connection,
      });

      queue.on("error", (err) => {
        Logger.error(`Queue "${name}" error:`, err.message);
      });

      QueueManager.queues.set(name, queue);
      Logger.debug(`Queue "${name}" created.`);
    }

    return QueueManager.queues.get(name)!;
  }

  private static assertInitialised(): void {
    if (!QueueManager.initialised) {
      throw new Error(
        "QueueManager.init() must be called before using QueueManager.",
      );
    }
  }
}
