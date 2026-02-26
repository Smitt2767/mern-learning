import { JOB_NAME } from "@mern/core";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";

import { mailer } from "../services/mailer.js";

export const sendOrgInvitationEmail: TypedProcessor<
  typeof JOB_NAME.SEND_ORG_INVITATION_EMAIL
> = async (job) => {
  const {
    inviteeEmail,
    organizationName,
    invitedByName,
    roleName,
    token,
    expiresAt,
  } = job.data;

  Logger.info(
    `[mail] Sending org invitation → ${inviteeEmail} (org: ${organizationName})`,
  );

  const result = await mailer.sendOrgInvitation({
    inviteeEmail,
    organizationName,
    invitedByName,
    roleName,
    token,
    expiresAt,
  });

  const messageId = result.data?.id ?? "";
  Logger.success(
    `[mail] Org invitation sent → ${inviteeEmail} — messageId: ${messageId}`,
  );

  return { messageId };
};
