import type { Job, JobsOptions } from "bullmq";

// ─── Core registry pattern ────────────────────────────────────────────────────

/**
 * A registry is a plain TypeScript interface where:
 *   key   = job name (string literal)
 *   value = the shape of that job's data payload
 *
 * Consumers define their own registry (e.g. EmailJobRegistry) and pass it
 * as the generic to QueueManager and WorkerManager.  TypeScript then enforces
 * correct payload shapes everywhere automatically.
 *
 * Example:
 *   interface EmailJobRegistry {
 *     'send-verification-email': { userId: string; email: string; ... };
 *     'send-welcome-email':      { userId: string; email: string; ... };
 *   }
 */

export type JobRegistry = Record<string, any>;

/**
 * Utility — pull the payload type for one specific job out of a registry.
 *
 * Example:
 *   type VerifyPayload = InferJobData<EmailJobRegistry, 'send-verification-email'>;
 *   // → { userId: string; email: string; firstName: string; verificationToken: string }
 */
export type InferJobData<
  TRegistry extends JobRegistry,
  TName extends keyof TRegistry,
> = TRegistry[TName];

/**
 * A single handler function for a named job.
 * Receives the full BullMQ Job object so you can access job.id, job.attemptsMade, etc.
 */
export type JobHandler<
  TRegistry extends JobRegistry,
  TName extends keyof TRegistry & string,
> = (job: Job<TRegistry[TName]>) => Promise<void>;

/**
 * A complete map of handlers — every key in TRegistry MUST appear here.
 * If you add a new job to the registry and forget to add a handler in the
 * WorkerManager, TypeScript raises a compile error immediately.
 */
export type HandlerMap<TRegistry extends JobRegistry> = {
  [TName in keyof TRegistry & string]: JobHandler<TRegistry, TName>;
};

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────

/**
 * Optional lifecycle hooks that fire at each stage of a job's life.
 *
 * The @mern/queue package itself stays decoupled from any database or
 * external service.  Consumers (mail-server) pass concrete implementations
 * of these hooks, e.g. writing rows to the job_logs table.
 *
 * Each hook is fire-and-forget from the worker's perspective — errors
 * inside a hook are caught and logged but will NOT fail the job itself.
 */
export interface WorkerHooks {
  /** Called just before the handler runs. Use to record job start time. */
  onJobStarted?: (job: Job) => Promise<void>;
  /** Called after the handler resolves without throwing. */
  onJobCompleted?: (job: Job) => Promise<void>;
  /** Called after the worker marks the job failed (all retries exhausted). */
  onJobFailed?: (job: Job, error: Error) => Promise<void>;
}

// Re-export BullMQ's JobsOptions so callers don't need a direct bullmq import
export type { JobsOptions };
