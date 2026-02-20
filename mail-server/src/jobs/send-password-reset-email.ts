import { JOB_NAME } from "@mern/core"
import { Logger } from "@mern/logger"
import type { TypedProcessor } from "@mern/queue"

import { mailer } from "../services/mailer.js"

export const sendPasswordResetEmail: TypedProcessor<
  typeof JOB_NAME.SEND_PASSWORD_RESET_EMAIL
> = async (job) => {
  Logger.info(`[mail] Sending password reset email → ${job.data.email}`)

  const result = await mailer.sendPasswordReset({
    email: job.data.email,
    token: job.data.token,
    expiresAt: job.data.expiresAt,
  })

  const messageId = result.data?.id ?? ""
  Logger.success(`[mail] Password reset email sent — messageId: ${messageId}`)

  return { messageId }
}
