// ─── Job Names ────────────────────────────────────────────────────────────────
// Add new job names here as your application grows.
// These are the single source of truth — used in queues, workers, the DB enum,
// and the JobDataMap type below.

export const JOB_NAME = {
  // ── Auth / User emails ────────────────────────────────────────────────────
  SEND_WELCOME_EMAIL: "send-welcome-email",
  SEND_EMAIL_VERIFICATION: "send-email-verification",
  SEND_PASSWORD_RESET_EMAIL: "send-password-reset-email",

  // ── Maintenance / Cron ───────────────────────────────────────────────────
  PURGE_EXPIRED_SESSIONS: "purge-expired-sessions",
  PURGE_EXPIRED_TOKENS: "purge-expired-tokens",
} as const;

export type JobName = (typeof JOB_NAME)[keyof typeof JOB_NAME];

/** Tuple — required by pgEnum and Zod enums */
export const JOB_NAMES = Object.values(JOB_NAME) as [JobName, ...JobName[]];

// ─── Job Statuses ─────────────────────────────────────────────────────────────

export const JOB_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  DELAYED: "delayed",
  PAUSED: "paused",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUSES = Object.values(JOB_STATUS) as [
  JobStatus,
  ...JobStatus[],
];
