import { JOB_NAME } from "@mern/core"
import { WorkerManager } from "@mern/queue"
import type { WorkerHandlerMap } from "@mern/queue"

import { sendEmailVerification } from "../jobs/send-email-verification.js"
import { sendPasswordResetEmail } from "../jobs/send-password-reset-email.js"
import { sendWelcomeEmail } from "../jobs/send-welcome-email.js"

const emailHandlers: WorkerHandlerMap = {
  [JOB_NAME.SEND_WELCOME_EMAIL]: sendWelcomeEmail,
  [JOB_NAME.SEND_EMAIL_VERIFICATION]: sendEmailVerification,
  [JOB_NAME.SEND_PASSWORD_RESET_EMAIL]: sendPasswordResetEmail,
}

export function registerEmailWorker(): void {
  WorkerManager.register(emailHandlers)
}
