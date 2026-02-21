// ─── Enums ────────────────────────────────────────────────────────────────────
export {
  accountProviderEnum,
  jobNameEnum,
  jobStatusEnum,
  permissionActionEnum,
  userStatusEnum,
} from "./enums.js";

// ─── RBAC ─────────────────────────────────────────────────────────────────────
export {
  permissions,
  permissionsRelations,
  type NewPermission,
  type Permission,
} from "./permissions.js";

export { roles, rolesRelations, type NewRole, type Role } from "./roles.js";

export {
  rolePermissions,
  rolePermissionsRelations,
  type NewRolePermission,
  type RolePermission,
} from "./role-permissions.js";

// ─── Core tables ──────────────────────────────────────────────────────────────
export {
  accounts,
  accountsRelations,
  type Account,
  type NewAccount,
} from "./accounts.js";

export {
  emailVerifications,
  emailVerificationsRelations,
  type EmailVerification,
  type NewEmailVerification,
} from "./email-verifications.js";

export {
  jobRecords,
  type JobRecord,
  type NewJobRecord,
} from "./job-records.js";

export {
  passwordResetTokens,
  passwordResetTokensRelations,
  type NewPasswordResetToken,
  type PasswordResetToken,
} from "./password-reset-tokens.js";

export {
  sessions,
  sessionsRelations,
  type NewSession,
  type Session,
} from "./sessions.js";

export { users, usersRelations, type NewUser, type User } from "./users.js";
