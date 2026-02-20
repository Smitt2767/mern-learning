import { JOB_NAME } from "@mern/core"
import { Logger } from "@mern/logger"
import type { TypedProcessor } from "@mern/queue"

import { mailer } from "../services/mailer.js"

export const sendEmailVerification: TypedProcessor<
  typeof JOB_NAME.SEND_EMAIL_VERIFICATION
> = async (job) => {
  Logger.info(`[mail] Sending email verification → ${job.data.email}`)

  const result = await mailer.sendEmailVerification({
    email: job.data.email,
    token: job.data.token,
    expiresAt: job.data.expiresAt,
  })

  const messageId = result.data?.id ?? ""
  Logger.success(`[mail] Email verification sent — messageId: ${messageId}`)

  return { messageId }
}
