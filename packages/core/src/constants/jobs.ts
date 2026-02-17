// Mirrors the pattern of user-status.ts, user-role.ts, etc.
// Used by: @mern/database (pgEnum), mail-server (JobLogService), any admin UI

export const JOB_STATUS = {
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// The tuple form is required by Drizzle's pgEnum — must be [T, ...T[]]
export const JOB_STATUSES = Object.values(JOB_STATUS) as [
  JobStatus,
  ...JobStatus[],
];
