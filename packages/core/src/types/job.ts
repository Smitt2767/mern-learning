import type { JOB_NAME } from "../constants/job.js";

// ─── Per-Job Payload Types ────────────────────────────────────────────────────
// Each key must match a value in JOB_NAME exactly.
// Adding a new job name forces you to define its data shape here.

export interface JobDataMap {
  // ── Auth / User emails ──────────────────────────────────────────────────
  [JOB_NAME.SEND_WELCOME_EMAIL]: {
    userId: string;
    email: string;
    firstName: string;
  };

  [JOB_NAME.SEND_EMAIL_VERIFICATION]: {
    userId: string;
    email: string;
    token: string;
    expiresAt: string; // ISO-8601 — serialisable across queue boundary
  };

  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: {
    userId: string;
    email: string;
    token: string;
    expiresAt: string;
  };

  // ── Organization emails ─────────────────────────────────────────────────
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: {
    invitationId: string;
    organizationName: string;
    organizationSlug: string;
    invitedByName: string; // "<firstName> <lastName>"
    inviteeEmail: string;
    roleName: string; // the role the invitee will receive
    token: string; // used to build the invite link
    expiresAt: string; // ISO-8601
  };

  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: {
    organizationName: string;
    organizationSlug: string;
    newMemberName: string; // "<firstName> <lastName>"
    newMemberEmail: string;
    roleName: string;
    notifyEmails: string[]; // all owner + admin emails to notify
  };

  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: {
    organizationName: string;
    organizationSlug: string;
    memberEmail: string;
    memberName: string; // "<firstName> <lastName>"
    oldRoleName: string;
    newRoleName: string;
  };

  // ── Maintenance / Cron ────────────────────────────────────────────────
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: Record<string, never>;
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: Record<string, never>;
}

// ─── Per-Job Result Types ─────────────────────────────────────────────────────
// Returned by the worker processor — stored in job_records.result column.

export interface JobResultMap {
  [JOB_NAME.SEND_WELCOME_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: { messageId: string };
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: { messageId: string };
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: { deletedCount: number };
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: { deletedCount: number };
}
