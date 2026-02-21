import type { JobDataMap, JobName, JobResultMap, JobStatus } from "@mern/core";
import { JOB_STATUS } from "@mern/core";
import {
  jobRecords,
  type DbInstance,
  type JobRecord,
  type NewJobRecord,
} from "@mern/database";
import { Logger } from "@mern/logger";
import { and, desc, eq, type SQL } from "drizzle-orm";

// JobRecordService depends on a DB instance being passed in.
// Consumers must call JobRecordService.init(db) at startup.
let _db: DbInstance | null = null;

/**
 * JobRecordService
 *
 * Persists BullMQ job lifecycle events to the `job_records` table.
 * Called automatically by WorkerManager event hooks — you rarely need
 * to call this directly unless building an admin UI.
 *
 * Must be initialised with a DB instance before use:
 * ```ts
 * JobRecordService.init(database.db);
 * ```
 */
export class JobRecordService {
  private constructor() {}

  // ─── Initialisation ────────────────────────────────────────────────────────

  static init(db: DbInstance): void {
    _db = db;
  }

  // ─── Write operations (called by WorkerManager hooks) ─────────────────────

  /**
   * Create a new job record immediately after enqueueing.
   * Call this from QueueManager.add() or your application code.
   */
  static async create<N extends JobName>(
    params: {
      bullJobId: string;
      queueName: string;
      jobName: N;
      data: JobDataMap[N];
      maxAttempts?: number;
      scheduledFor?: Date;
    },
    tx?: DbInstance,
  ): Promise<JobRecord | null> {
    if (!_db && !tx) {
      Logger.warn(
        `JobRecordService.create: not initialised — skipping record for job "${params.jobName}".`,
      );
      return null;
    }
    const db = JobRecordService.getDb(tx);

    const record: NewJobRecord = {
      bullJobId: params.bullJobId,
      queueName: params.queueName,
      jobName: params.jobName,
      data: params.data,
      status: JOB_STATUS.WAITING,
      maxAttempts: params.maxAttempts ?? 3,
      ...(params.scheduledFor ? { scheduledFor: params.scheduledFor } : {}),
    };

    const [created] = await db.insert(jobRecords).values(record).returning();
    return created!;
  }

  /** Transition → active when a worker picks up the job. */
  static async markActive(
    bullJobId: string,
    attempts: number,
    tx?: DbInstance,
  ): Promise<void> {
    await JobRecordService.updateByBullId(
      bullJobId,
      {
        status: JOB_STATUS.ACTIVE,
        attempts,
        processedAt: new Date(),
      },
      tx,
    );
  }

  /** Transition → completed when the processor resolves. */
  static async markCompleted<N extends JobName>(
    bullJobId: string,
    result: JobResultMap[N],
    tx?: DbInstance,
  ): Promise<void> {
    await JobRecordService.updateByBullId(
      bullJobId,
      {
        status: JOB_STATUS.COMPLETED,
        result: result as JobResultMap[keyof JobResultMap],
        progress: 100,
        completedAt: new Date(),
      },
      tx,
    );
  }

  /** Transition → failed when all retry attempts are exhausted. */
  static async markFailed(
    bullJobId: string,
    attempts: number,
    error: string,
    errorStack?: string,
    tx?: DbInstance,
  ): Promise<void> {
    await JobRecordService.updateByBullId(
      bullJobId,
      {
        status: JOB_STATUS.FAILED,
        attempts,
        error,
        progress: 100,
        ...(errorStack ? { errorStack } : {}),
        failedAt: new Date(),
      },
      tx,
    );
  }

  /**
   * Update the progress percentage for a running job (0–100).
   *
   * Call this from inside a job processor to report intermediate progress
   * for long-running tasks. The value is clamped to [0, 100].
   *
   * @example
   * await JobRecordService.updateProgress(job.id!, 50); // halfway done
   */
  static async updateProgress(
    bullJobId: string,
    progress: number,
    tx?: DbInstance,
  ): Promise<void> {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    await JobRecordService.updateByBullId(bullJobId, { progress: clamped }, tx);
  }

  // ─── Read operations (admin / monitoring) ─────────────────────────────────

  static async findByBullId(
    bullJobId: string,
    tx?: DbInstance,
  ): Promise<JobRecord | undefined> {
    const db = JobRecordService.getDb(tx);
    return db.query.jobRecords.findFirst({
      where: eq(jobRecords.bullJobId, bullJobId),
    });
  }

  static async findById(
    id: string,
    tx?: DbInstance,
  ): Promise<JobRecord | undefined> {
    const db = JobRecordService.getDb(tx);
    return db.query.jobRecords.findFirst({
      where: eq(jobRecords.id, id),
    });
  }

  static async findMany(
    filters: {
      jobName?: JobName;
      status?: JobStatus;
      queueName?: string;
    } = {},
    pagination: { limit?: number; offset?: number } = {},
    tx?: DbInstance,
  ): Promise<JobRecord[]> {
    const db = JobRecordService.getDb(tx);
    const { limit = 50, offset = 0 } = pagination;

    const conditions: SQL[] = [];
    if (filters.jobName)
      conditions.push(eq(jobRecords.jobName, filters.jobName));
    if (filters.status) conditions.push(eq(jobRecords.status, filters.status));
    if (filters.queueName)
      conditions.push(eq(jobRecords.queueName, filters.queueName));

    return db
      .select()
      .from(jobRecords)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobRecords.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async countByStatus(
    tx?: DbInstance,
  ): Promise<Record<JobStatus, number>> {
    const db = JobRecordService.getDb(tx);
    const rows = await db.select().from(jobRecords);

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts as Record<JobStatus, number>;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private static async updateByBullId(
    bullJobId: string,
    data: Partial<NewJobRecord>,
    tx?: DbInstance,
  ): Promise<void> {
    try {
      const db = JobRecordService.getDb(tx);
      await db
        .update(jobRecords)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(jobRecords.bullJobId, bullJobId));
    } catch (err) {
      // Never let a DB error crash the worker
      Logger.error(
        `JobRecordService failed to update job "${bullJobId}":`,
        (err as Error).message,
      );
    }
  }

  private static getDb(tx?: DbInstance): DbInstance {
    const db = tx ?? _db;
    if (!db) {
      throw new Error(
        "JobRecordService.init(db) must be called before using JobRecordService.",
      );
    }
    return db;
  }
}
