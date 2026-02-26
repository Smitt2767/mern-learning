import type { DefaultJobOptions, QueueOptions, WorkerOptions } from "bullmq";

// ─── Queue Names ──────────────────────────────────────────────────────────────

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
// Every JOB_NAME value must appear here exactly once.

import { JOB_NAME, type JobName } from "@mern/core";

export const JOB_QUEUE_MAP: Record<JobName, QueueName> = {
  // Email queue
  [JOB_NAME.SEND_WELCOME_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: QUEUE_NAME.EMAIL,
  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: QUEUE_NAME.EMAIL,
  // Maintenance queue
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: QUEUE_NAME.MAINTENANCE,
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: QUEUE_NAME.MAINTENANCE,
  [JOB_NAME.PURGE_EXPIRED_INVITATIONS]: QUEUE_NAME.MAINTENANCE,
};

// ─── Default Options ──────────────────────────────────────────────────────────

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5_000,
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
    duration: 10_000,
  },
};
