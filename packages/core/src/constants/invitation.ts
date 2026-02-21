// ─── Invitation Statuses ──────────────────────────────────────────────────────
// Tracks the full lifecycle of an organization invitation.
//
// Flow:
//   pending → accepted   invitee joined (triggered on signup/login email match)
//   pending → cancelled  admin/owner cancelled it, or invitee explicitly rejected
//   pending → expired    past expiresAt, marked by the maintenance cron job

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/** Tuple — required by pgEnum */
export const INVITATION_STATUSES = Object.values(INVITATION_STATUS) as [
  InvitationStatus,
  ...InvitationStatus[],
];

// ─── Invite Token Expiry ──────────────────────────────────────────────────────
// How long (in hours) an invitation token remains valid after creation.

export const INVITATION_EXPIRY_HOURS = 72;
