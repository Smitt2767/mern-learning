import {
  ACCOUNT_PROVIDERS,
  JOB_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "@mern/core";
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const userStatusEnum = pgEnum("user_status", USER_STATUSES);
export const accountProviderEnum = pgEnum(
  "account_provider",
  ACCOUNT_PROVIDERS,
);
export const jobStatusEnum = pgEnum("job_status", JOB_STATUSES);
