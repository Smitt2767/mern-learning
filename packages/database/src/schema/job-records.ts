import type { JobDataMap, JobResultMap } from "@mern/core";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { jobNameEnum, jobStatusEnum } from "./enums.js";

export const jobRecords = pgTable(
  "job_records",
  {
    id,

    // ── BullMQ identifiers ────────────────────────────────────────────────
    /** The ID BullMQ assigned when the job was added to the queue. */
    bullJobId: varchar({ length: 255 }).notNull(),
    /** The BullMQ queue name this job belongs to. */
    queueName: varchar({ length: 255 }).notNull(),
    /** Discriminator — must match a value in JOB_NAME. */
    jobName: jobNameEnum().notNull(),

    // ── Lifecycle ─────────────────────────────────────────────────────────
    status: jobStatusEnum().notNull().default("waiting"),
    /** Number of times BullMQ has attempted this job so far. */
    attempts: integer().notNull().default(0),
    /** Max attempts configured at enqueue time. */
    maxAttempts: integer().notNull().default(3),
    /**
     * Completion percentage (0–100).
     * Set to 0 on enqueue, 100 on completion or failure.
     * For long-running jobs, call JobRecordService.updateProgress() with
     * intermediate values (e.g. 25, 50, 75) as work progresses.
     */
    progress: integer().notNull().default(0),

    // ── Payload & result ──────────────────────────────────────────────────
    /** Typed JSON payload — shape depends on jobName. */
    data: jsonb().$type<JobDataMap[keyof JobDataMap]>().notNull(),
    /** Return value from the processor on success. */
    result: jsonb().$type<JobResultMap[keyof JobResultMap]>(),
    /** Stringified error message when status = 'failed'. */
    error: text(),
    /** Full error stack trace for debugging. */
    errorStack: text(),

    // ── Timestamps ────────────────────────────────────────────────────────
    /** When the job should be picked up (null = immediately). */
    scheduledFor: timestamp({ withTimezone: true, mode: "date" }),
    /** When a worker first picked up this job. */
    processedAt: timestamp({ withTimezone: true, mode: "date" }),
    /** When the processor returned successfully. */
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
    /** When the job exhausted all retry attempts. */
    failedAt: timestamp({ withTimezone: true, mode: "date" }),

    createdAt,
    updatedAt,
  },
  (table) => [
    index("idx_job_records_bull_job_id").on(table.bullJobId),
    index("idx_job_records_queue_name").on(table.queueName),
    index("idx_job_records_job_name").on(table.jobName),
    index("idx_job_records_status").on(table.status),
    index("idx_job_records_created_at").on(table.createdAt),
    // Composite — most common query pattern: "show me failed email jobs"
    index("idx_job_records_job_name_status").on(table.jobName, table.status),
  ],
);

export type JobRecord = typeof jobRecords.$inferSelect;
export type NewJobRecord = typeof jobRecords.$inferInsert;
