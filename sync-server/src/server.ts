import { Logger } from "@mern/logger";
import { QueueRegistry } from "@mern/queue";
import { database } from "./config/db.js";
import { redis, redisConnectionOptions } from "./config/redis.js";
import { registerSyncCronJobs } from "./cron/index.js";
import { registerMaintenanceWorker } from "./workers/maintenance.js";

/**
 * SyncServer
 *
 * A lightweight, HTTP-free process whose sole responsibility is to:
 *  1. Connect to the database and Redis
 *  2. Spin up BullMQ workers for maintenance jobs
 *  3. Schedule nightly cron jobs via the BullMQ Scheduler
 *
 * Only ONE instance of this process should run in your cluster so that
 * cron jobs are not registered more than once. BullMQ deduplicates
 * repeatable jobs by (jobName + cron pattern), but a single process
 * keeps things predictable.
 *
 * Usage:
 * ```ts
 * const server = new SyncServer();
 * await server.start();
 * ```
 */
export class SyncServer {
  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    Logger.info("SyncServer starting…");

    // 1. Database
    await database.connect();

    // 2. Queue subsystem — this process owns both workers AND the scheduler.
    //    We pass `redisConnectionOptions` (a plain object) instead of the
    //    Redis instance so BullMQ constructs its own ioredis clients internally.
    //    This avoids the exactOptionalPropertyTypes type error that occurs when
    //    pnpm resolves two different ioredis patch versions across packages.
    QueueRegistry.init({
      connection: redisConnectionOptions,
      db: database.db,
      enableWorkers: true,
      enableScheduler: true,
    });

    // 3. Register job processors
    registerMaintenanceWorker();

    // 4. Schedule cron jobs
    await registerSyncCronJobs();

    // 5. Graceful shutdown hooks
    this.registerShutdownHooks();

    Logger.success("SyncServer started — workers and cron jobs are live.");
  }

  // ─── Shutdown ───────────────────────────────────────────────────────────────

  private registerShutdownHooks(): void {
    const shutdown = async (signal: string) => {
      Logger.info(`[sync] Received ${signal} — shutting down gracefully…`);

      try {
        await QueueRegistry.shutdown();
        await database.client.end();
        await redis.quit();
        Logger.success("[sync] Graceful shutdown complete.");
      } catch (err) {
        Logger.error("[sync] Error during shutdown:", err);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("uncaughtException", (err) => {
      Logger.error("[sync] Uncaught exception:", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      Logger.error("[sync] Unhandled rejection:", reason);
      process.exit(1);
    });
  }
}
