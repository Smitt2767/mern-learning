import { JOB_NAME } from "@mern/core";
import { WorkerManager, type WorkerHandlerMap } from "@mern/queue";

import { purgeExpiredInvitations } from "../jobs/purge-expired-invitations.js";
import { purgeExpiredSessions } from "../jobs/purge-expired-sessions.js";
import { purgeExpiredTokens } from "../jobs/purge-expired-tokens.js";

const maintenanceHandlers: WorkerHandlerMap = {
  [JOB_NAME.PURGE_EXPIRED_SESSIONS]: purgeExpiredSessions,
  [JOB_NAME.PURGE_EXPIRED_TOKENS]: purgeExpiredTokens,
  [JOB_NAME.PURGE_EXPIRED_INVITATIONS]: purgeExpiredInvitations,
};

export function registerMaintenanceWorker(): void {
  WorkerManager.register(maintenanceHandlers);
}
