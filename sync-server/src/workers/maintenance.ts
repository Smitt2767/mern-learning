import { JOB_NAME } from "@mern/core";
import { WorkerManager, type WorkerHandlerMap } from "@mern/queue";
import { purgeExpiredSessions } from "../jobs/purge-expired-sessions.js";
import { purgeExpiredTokens } from "../jobs/purge-expired-tokens.js";

/**
 * maintenanceHandlers
 *
 * Maps each maintenance job name to its typed processor.
 * Pass this directly to `WorkerManager.register()`.
 */
const maintenanceHandlers: WorkerHandlerMap = {
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: purgeExpiredSessions,
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: purgeExpiredTokens,
};

/**
 * registerMaintenanceWorker
 *
 * Registers all maintenance job processors with the WorkerManager.
 * Must be called after `QueueRegistry.init()`.
 */
export function registerMaintenanceWorker(): void {
  WorkerManager.register(maintenanceHandlers);
}
