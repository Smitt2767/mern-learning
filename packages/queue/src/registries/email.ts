/**
 * Email Job Registry
 *
 * This interface is the SINGLE SOURCE OF TRUTH for all email job types.
 * Both the producer (auth-server's QueueManager) and the consumer
 * (mail-server's WorkerManager) import from here.
 *
 * Adding a new email type:
 *   1. Add an entry to EmailJobRegistry below
 *   2. Build @mern/queue
 *   3. TypeScript will error in mail-server's WorkerManager until you add
 *      a handler, and in any server calling emailQueue.add() if you pass
 *      a wrong payload shape.
 *
 * Never use string literals for job names outside of this file.
 * Always import EMAIL_QUEUE_NAME instead of hardcoding 'email'.
 */
export interface EmailJobRegistry {
  "send-verification-email": {
    userId: string;
    email: string;
    firstName: string;
    verificationToken: string;
  };

  "send-welcome-email": {
    userId: string;
    email: string;
    firstName: string;
  };

  "send-password-reset-email": {
    userId: string;
    email: string;
    firstName: string;
    resetToken: string;
  };
}

/**
 * The queue name used by both QueueManager and WorkerManager.
 * Must match exactly — this is what BullMQ uses as the Redis key prefix.
 */
export const EMAIL_QUEUE_NAME = "email" as const;
