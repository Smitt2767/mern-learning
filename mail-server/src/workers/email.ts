import { JOB_NAME } from "@mern/core";
import type { WorkerHandlerMap } from "@mern/queue";
import { WorkerManager } from "@mern/queue";

import { sendEmailVerification } from "../jobs/send-email-verification.js";
import { sendOrgInvitationEmail } from "../jobs/send-org-invitation-email.js";
import { sendOrgMemberJoinedEmail } from "../jobs/send-org-member-joined-email.js";
import { sendOrgRoleChangedEmail } from "../jobs/send-org-role-changed-email.js";
import { sendPasswordResetEmail } from "../jobs/send-password-reset-email.js";
import { sendWelcomeEmail } from "../jobs/send-welcome-email.js";

const emailHandlers: WorkerHandlerMap = {
  [JOB_NAME.SEND_WELCOME_EMAIL]: sendWelcomeEmail,
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: sendEmailVerification,
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: sendPasswordResetEmail,
  [JOB_NAME.SEND_ORG_INVITATION_EMAIL]: sendOrgInvitationEmail,
  [JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL]: sendOrgMemberJoinedEmail,
  [JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL]: sendOrgRoleChangedEmail,
};

export function registerEmailWorker(): void {
  WorkerManager.register(emailHandlers);
}
