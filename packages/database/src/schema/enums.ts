import {
  ACCOUNT_PROVIDERS,
  JOB_NAMES,
  JOB_STATUSES,
  PERMISSION_ACTIONS,
  USER_STATUSES,
} from "@mern/core";
import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", USER_STATUSES);
export const accountProviderEnum = pgEnum(
  "account_provider",
  ACCOUNT_PROVIDERS,
);
export const jobNameEnum = pgEnum("job_name", JOB_NAMES);
export const jobStatusEnum = pgEnum("job_status", JOB_STATUSES);

// ─── RBAC ─────────────────────────────────────────────────────────────────────
// none → read → write → delete (hierarchy enforced in authorize() middleware)
export const permissionActionEnum = pgEnum(
  "permission_action",
  PERMISSION_ACTIONS,
);
