import type { JOB_NAME } from "../constants/job.js";

// ─── Per-Job Payload Types ────────────────────────────────────────────────────

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
    expiresAt: string;
  };

  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: {
    userId: string;
    email: string;
    token: string;
    expiresAt: string;
  };

  // ── Organization emails ────────────────────────────────────────────────
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: {
    invitationId: string;
    organizationName: string;
    organizationSlug: string;
    invitedByName: string;
    inviteeEmail: string;
    roleName: string;
    token: string;
    expiresAt: string;
  };

  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: {
    organizationName: string;
    organizationSlug: string;
    newMemberName: string;
    newMemberEmail: string;
    roleName: string;
    notifyEmails: string[];
  };

  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: {
    organizationName: string;
    organizationSlug: string;
    memberEmail: string;
    memberName: string;
    oldRoleName: string;
    newRoleName: string;
  };

  // ── Maintenance / Cron ────────────────────────────────────────────────
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: Record<string, never>;
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: Record<string, never>;
  [JOB_NAME.PURGE_EXPIRED_INVITATIONS]: Record<string, never>;
}

// ─── Per-Job Result Types ─────────────────────────────────────────────────────

export interface JobResultMap {
  [JOB_NAME.SEND_WELCOME_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: { messageId: string };
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: { messageId: string };
  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: { messageId: string };
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: { deletedCount: number };
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: { deletedCount: number };
  [JOB_NAME.PURGE_EXPIRED_INVITATIONS]: { deletedCount: number };
}
