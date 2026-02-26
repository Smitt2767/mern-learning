import { JOB_NAME } from "@mern/core";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";

import { mailer } from "../services/mailer.js";

export const sendOrgRoleChangedEmail: TypedProcessor<
  typeof JOB_NAME.SEND_ORG_ROLE_CHANGED_EMAIL
> = async (job) => {
  const {
    memberEmail,
    memberName,
    organizationName,
    organizationSlug,
    oldRoleName,
    newRoleName,
  } = job.data;

  Logger.info(
    `[mail] Sending role-changed notification → ${memberEmail} (org: ${organizationName}, ${oldRoleName} → ${newRoleName})`,
  );

  const result = await mailer.sendOrgRoleChanged({
    memberEmail,
    memberName,
    organizationName,
    organizationSlug,
    oldRoleName,
    newRoleName,
  });

  const messageId = result.data?.id ?? "";
  Logger.success(
    `[mail] Role-changed notification sent → ${memberEmail} — messageId: ${messageId}`,
  );

  return { messageId };
};
