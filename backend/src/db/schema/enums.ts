import { ACCOUNT_PROVIDERS, USER_ROLES, USER_STATUSES } from "@mern/shared";
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const userStatusEnum = pgEnum("user_status", USER_STATUSES);
export const accountProviderEnum = pgEnum(
  "account_provider",
  ACCOUNT_PROVIDERS,
);
