// ─── Job Names ────────────────────────────────────────────────────────────────
// Single source of truth — used in queues, workers, DB enum, and JobDataMap.
// ⚠️  When adding a new job:
//   1. Add the name here
//   2. Add its payload + result types in types/job.ts
//   3. Map it to a queue in packages/queue/src/constants/index.ts

export const JOB_NAME = {
  // ── Auth / User emails ────────────────────────────────────────────────────
  SEND_WELCOME_EMAIL: "send-welcome-email",
  SEND_EMAIL_VERIFICATION: "send-email-verification",
  SEND_PASSWORD_RESET_EMAIL: "send-password-reset-email",

  // ── Organization emails ───────────────────────────────────────────────────
  SEND_ORG_INVITATION_EMAIL: "send-org-invitation-email",
  SEND_ORG_MEMBER_JOINED_EMAIL: "send-org-member-joined-email",
  SEND_ORG_ROLE_CHANGED_EMAIL: "send-org-role-changed-email",

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
