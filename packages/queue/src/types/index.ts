import type { JobDataMap, JobName, JobResultMap } from "@mern/core";
import type { Job, JobsOptions, Processor } from "bullmq";

// ─── Typed Processor ─────────────────────────────────────────────────────────
// Ensures the processor function receives the correct data shape for a given
// job name, and returns the correct result shape.

export type TypedProcessor<N extends JobName> = Processor<
  JobDataMap[N],
  JobResultMap[N]
>;

// ─── Worker Handler Map ───────────────────────────────────────────────────────
// Pass this to WorkerManager.register() — each key is a job name,
// the value is its strongly-typed processor.

export type WorkerHandlerMap = {
  [N in JobName]?: TypedProcessor<N>;
};

// ─── Add Job Options ──────────────────────────────────────────────────────────
// Extends BullMQ's JobsOptions with our typed job data.

export type AddJobOptions = Omit<JobsOptions, "jobId">;

// ─── Cron Job Definition ──────────────────────────────────────────────────────

export interface CronJobDefinition<N extends JobName> {
  /** Human-readable name for logging. */
  name: string;
  jobName: N;
  data: JobDataMap[N];
  /** Standard cron expression, e.g. "0 3 * * *" for 3 AM daily. */
  cron: string;
  /** Optional timezone, e.g. "UTC" or "America/New_York". */
  tz?: string;
  options?: Omit<AddJobOptions, "repeat">;
}

// ─── Re-exports for consumer convenience ─────────────────────────────────────
export type { Job, JobsOptions };
