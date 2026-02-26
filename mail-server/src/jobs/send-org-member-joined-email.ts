import { JOB_NAME } from "@mern/core";
import { Logger } from "@mern/logger";
import type { TypedProcessor } from "@mern/queue";

import { mailer } from "../services/mailer.js";

export const sendOrgMemberJoinedEmail: TypedProcessor<
  typeof JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL
> = async (job) => {
  const {
    organizationName,
    organizationSlug,
    newMemberName,
    newMemberEmail,
    roleName,
    notifyEmails,
  } = job.data;

  if (notifyEmails.length === 0) {
    Logger.info("[mail] No admins to notify for member joined — skipping");
    return { messageId: "" };
  }

  Logger.info(
    `[mail] Sending member-joined notifications → ${notifyEmails.length} recipient(s) (org: ${organizationName})`,
  );

  // Send to each admin/owner individually so personalisation is possible in future
  const results = await Promise.allSettled(
    notifyEmails.map((email) =>
      mailer.sendOrgMemberJoined({
        notifyEmail: email,
        organizationName,
        organizationSlug,
        newMemberName,
        newMemberEmail,
        roleName,
      }),
    ),
  );

  const sentIds: string[] = [];
  let failCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      sentIds.push(result.value.data?.id ?? "");
    } else {
      failCount++;
      Logger.error(
        `[mail] Failed to send member-joined notification: ${String(result.reason)}`,
      );
    }
  }

  if (failCount > 0) {
    Logger.warn(
      `[mail] Member-joined: ${failCount}/${notifyEmails.length} notifications failed`,
    );
  }

  Logger.success(
    `[mail] Member-joined notifications sent: ${sentIds.length}/${notifyEmails.length} succeeded`,
  );

  return { messageId: sentIds.join(",") };
};
