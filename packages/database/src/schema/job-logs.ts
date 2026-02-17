import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { jobStatusEnum } from "./enums.js";

/**
 * job_logs
 *
 * Persists every BullMQ job lifecycle event (started, completed, failed)
 * to Postgres.  This gives you a permanent, queryable audit trail that
 * survives Redis flushes, TTL expiry, and server restarts.
 *
 * Design notes:
 *   - One row per job attempt (BullMQ retries create new attempt numbers,
 *     we UPDATE the same row via bullJobId + queueName).
 *   - `payload` (jsonb) stores the exact data the job was given — invaluable
 *     for debugging and reproducing issues.
 *   - `userId` is nullable — not every queue/job type is user-scoped.
 *   - No Drizzle relation defined — this is an append-only audit table,
 *     we don't need ORM joins back to users.
 *   - No `updatedAt` helper — we track time explicitly with startedAt /
 *     completedAt / failedAt so each transition is independently queryable.
 */
export const jobLogs = pgTable(
  "job_logs",
  {
    id,

    // BullMQ assigns a string ID to every job (auto-incremented within the queue)
    bullJobId: varchar({ length: 255 }).notNull(),

    // Which queue produced this job (e.g. "email")
    queueName: varchar({ length: 100 }).notNull(),

    // The job name within the queue (e.g. "send-verification-email")
    jobName: varchar({ length: 100 }).notNull(),

    // Current lifecycle status
    status: jobStatusEnum().notNull().default("processing"),

    // The exact payload passed to the job — stored as jsonb for flexibility
    payload: jsonb().notNull(),

    // Populated only on failure — the error message from the thrown exception
    error: text(),

    // Which attempt number this row represents (1 = first try, 2 = first retry, …)
    attempt: integer().notNull().default(1),

    // Optional — denormalized for fast user-scoped queries without joins
    userId: uuid(),

    // Lifecycle timestamps — each is set exactly once during the job's life
    startedAt: timestamp({ withTimezone: true, mode: "date" }),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
    failedAt: timestamp({ withTimezone: true, mode: "date" }),

    // When the row was first inserted (always set, unlike the lifecycle fields)
    createdAt,
    updatedAt,
  },
  (table) => [
    // Primary lookup: find a specific job's row to UPDATE it
    index("idx_job_logs_bull_job_id").on(table.bullJobId, table.queueName),

    // Admin queries: "show me all failed jobs"
    index("idx_job_logs_status").on(table.status),

    // Admin queries: "show me all password-reset jobs"
    index("idx_job_logs_job_name").on(table.jobName),

    // User-scoped queries: "show all emails sent to user X"
    index("idx_job_logs_user_id").on(table.userId),

    // Time-range queries: "show failures in the last 24 hours"
    index("idx_job_logs_created_at").on(table.createdAt),
  ],
);

export type JobLog = typeof jobLogs.$inferSelect;
export type NewJobLog = typeof jobLogs.$inferInsert;
