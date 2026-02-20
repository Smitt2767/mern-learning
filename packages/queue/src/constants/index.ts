import type { DefaultJobOptions, QueueOptions, WorkerOptions } from "bullmq";

// ─── Queue Names ──────────────────────────────────────────────────────────────
// Group job names into logical queues.
// One queue can handle many job types — workers subscribe per-queue.

export const QUEUE_NAME = {
  EMAIL: "email",
  MAINTENANCE: "maintenance",
} as const;

export type QueueName = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME];

export const QUEUE_NAMES = Object.values(QUEUE_NAME) as [
  QueueName,
  ...QueueName[],
];

// ─── Job → Queue Mapping ──────────────────────────────────────────────────────
// Determines which queue a job is added to when using QueueManager.add().
// Every JOB_NAME value must appear here exactly once.

import { JOB_NAME, type JobName } from "@mern/core";

export const JOB_QUEUE_MAP: Record<JobName, QueueName> = {
  [JOB_NAME.SEND_WELCOME_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: QUEUE_NAME.MAINTENANCE,
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: QUEUE_NAME.MAINTENANCE,
};

// ─── Default Options ──────────────────────────────────────────────────────────

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5_000, // 5s → 25s → 125s
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export const DEFAULT_QUEUE_OPTIONS: Omit<QueueOptions, "connection"> = {
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
};

export const DEFAULT_WORKER_OPTIONS: Omit<WorkerOptions, "connection"> = {
  concurrency: 5,
  limiter: {
    max: 50,
    duration: 10_000, // 50 jobs per 10s per worker
  },
};
