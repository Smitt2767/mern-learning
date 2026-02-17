import {
  EMAIL_QUEUE_NAME,
  QueueManager,
  type EmailJobRegistry,
} from "@mern/queue";
import { env } from "../config/env.js";

/**
 * Email queue — the ONLY queue auth-server uses.
 *
 * This is a QueueManager (producer only).  auth-server enqueues jobs here;
 * mail-server's WorkerManager picks them up from the same Redis instance.
 *
 * Import `emailQueue` wherever you need to trigger an email:
 *
 *   import { emailQueue } from '../config/queues.js';
 *
 *   await emailQueue.add('send-verification-email', {
 *     userId: user.id,
 *     email: user.email,
 *     firstName: user.firstName,
 *     verificationToken,
 *   });
 *
 * The queue is initialized lazily on first import — no explicit .connect()
 * call needed.  BullMQ handles the Redis connection internally.
 */
export const emailQueue = new QueueManager<EmailJobRegistry>(EMAIL_QUEUE_NAME, {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // ← BullMQ requirement
});
