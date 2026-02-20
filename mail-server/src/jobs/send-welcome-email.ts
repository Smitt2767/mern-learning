import { JOB_NAME } from "@mern/core"
import { Logger } from "@mern/logger"
import type { TypedProcessor } from "@mern/queue"

import { mailer } from "../services/mailer.js"

export const sendWelcomeEmail: TypedProcessor<
  typeof JOB_NAME.SEND_WELCOME_EMAIL
> = async (job) => {
  Logger.info(`[mail] Sending welcome email → ${job.data.email}`)

  const result = await mailer.sendWelcomeEmail({
    email: job.data.email,
    firstName: job.data.firstName,
  })

  const messageId = result.data?.id ?? ""
  Logger.success(`[mail] Welcome email sent — messageId: ${messageId}`)

  return { messageId }
}
