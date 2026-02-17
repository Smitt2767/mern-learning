import { EMAIL_QUEUE_NAME, EmailJobRegistry, WorkerManager } from "@mern/queue";
import { env } from "../config/env.js";
import { JobLogService } from "../services/job-logs.js";
import { EmailService } from "./service.js";

/**
 * Email Worker
 *
 * This is the connective tissue of the mail-server:
 *
 * HandlerMap   → delegates to EmailService (business logic)
 * WorkerHooks  → delegates to JobLogService (observability)
 *
 * WorkerManager<EmailJobRegistry> enforces at COMPILE TIME that every
 * key in EmailJobRegistry has a corresponding handler in the map.
 * If you add a new job type to the registry and don't add a handler here,
 * TypeScript will raise an error before the code even runs.
 *
 * The worker begins processing jobs immediately upon instantiation.
 * No .start() call needed — BullMQ handles the polling loop internally.
 */
export const emailWorker = new WorkerManager<EmailJobRegistry>(
  EMAIL_QUEUE_NAME,
  {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // ← BullMQ requirement
  },
  // ── Handlers ───────────────────────────────────────────────────────────────
  // Each handler receives a fully-typed `job` — job.data matches the payload
  // type defined for that job name in EmailJobRegistry.
  {
    "send-verification-email": async (job) => {
      await EmailService.sendVerificationEmail(job.data);
    },

    "send-welcome-email": async (job) => {
      await EmailService.sendWelcomeEmail(job.data);
    },

    "send-password-reset-email": async (job) => {
      await EmailService.sendPasswordResetEmail(job.data);
    },
  },

  // ── Worker options ─────────────────────────────────────────────────────────
  {
    // Process up to 10 emails simultaneously.
    // Increase if Resend's rate limit allows; decrease if you hit DB contention.
    concurrency: 10,
  },

  // ── Lifecycle hooks → DB persistence ──────────────────────────────────────
  // Errors inside these hooks are caught by WorkerManager.runHook() and
  // logged — they will NOT cause the job to be retried or marked failed.
  {
    onJobStarted: (job) => JobLogService.onStarted(job, EMAIL_QUEUE_NAME),
    onJobCompleted: (job) => JobLogService.onCompleted(job, EMAIL_QUEUE_NAME),
    onJobFailed: (job, err) =>
      JobLogService.onFailed(job, err, EMAIL_QUEUE_NAME),
  },
);
