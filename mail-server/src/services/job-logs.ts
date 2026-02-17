import { jobLogs } from "@mern/database";
import type { Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import { db } from "../config/db.js";

/**
 * JobLogService
 *
 * Persists BullMQ job lifecycle events to the `job_logs` Postgres table.
 *
 * Called ONLY via WorkerManager hooks — never call this directly from a
 * job handler.  The separation ensures:
 *   - A DB write failure cannot affect BullMQ's job retry/failure state
 *   - The @mern/queue package stays 100% decoupled from @mern/database
 *
 * Pattern: one static method per WorkerHook (onStarted / onCompleted / onFailed)
 */
export class JobLogService {
  private constructor() {}

  /**
   * Called when the worker picks up a job and is about to run its handler.
   * Inserts a new row with status = 'processing'.
   *
   * We extract `userId` from the job payload if it exists — this lets us
   * query all jobs for a specific user without joins.
   */
  static async onStarted(job: Job, queueName: string): Promise<void> {
    const payload = job.data as Record<string, unknown>;
    const userId = typeof payload.userId === "string" ? payload.userId : null;

    await db.insert(jobLogs).values({
      bullJobId: String(job.id),
      queueName,
      jobName: job.name,
      status: "processing",
      payload, // jsonb — the exact data the job was given
      attempt: job.attemptsMade + 1, // attemptsMade is 0-indexed
      userId,
      startedAt: new Date(),
    });
  }

  /**
   * Called after the job handler resolves without throwing.
   * Updates the existing row to status = 'completed'.
   *
   * We match on bullJobId + queueName rather than our internal UUID because
   * that's what we have available inside BullMQ's event callbacks.
   */
  static async onCompleted(job: Job, queueName: string): Promise<void> {
    await db
      .update(jobLogs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(jobLogs.bullJobId, String(job.id)),
          eq(jobLogs.queueName, queueName),
        ),
      );
  }

  /**
   * Called after BullMQ marks the job as definitively failed
   * (all retry attempts exhausted, or the handler threw a non-retriable error).
   *
   * Records the error message so you can debug without digging into Redis.
   */
  static async onFailed(
    job: Job,
    error: Error,
    queueName: string,
  ): Promise<void> {
    await db
      .update(jobLogs)
      .set({
        status: "failed",
        error: error.message,
        attempt: job.attemptsMade, // Final attempt count
        failedAt: new Date(),
      })
      .where(
        and(
          eq(jobLogs.bullJobId, String(job.id)),
          eq(jobLogs.queueName, queueName),
        ),
      );
  }
}
