// ─── Core classes ─────────────────────────────────────────────────────────────
export { QueueManager } from "./queue-manager.js";
export { QueueRegistry } from "./queue-registry.js";
export type { QueueRegistryOptions } from "./queue-registry.js";
export { Scheduler } from "./scheduler.js";
export { WorkerManager } from "./worker-manager.js";

// ─── DB persistence service ───────────────────────────────────────────────────
export { JobRecordService } from "./services/job-record.js";

// ─── Constants ────────────────────────────────────────────────────────────────
export {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_QUEUE_OPTIONS,
  DEFAULT_WORKER_OPTIONS,
  JOB_QUEUE_MAP,
  QUEUE_NAME,
  QUEUE_NAMES,
} from "./constants/index.js";
export type { QueueName } from "./constants/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AddJobOptions,
  CronJobDefinition,
  Job,
  JobsOptions,
  TypedProcessor,
  WorkerHandlerMap,
} from "./types/index.js";
