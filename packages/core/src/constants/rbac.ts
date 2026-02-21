// ─── Permission Keys ──────────────────────────────────────────────────────────
// Each key represents a named resource that can be acted upon.
// Add new permission keys here as the system grows.
// ⚠️  When adding a new key, also add it to EVERY entry in SYSTEM_ROLE_PERMISSIONS below.

export const PERMISSION_KEY = {
  USER_MANAGEMENT: "USER_MANAGEMENT",
} as const;

export type PermissionKey =
  (typeof PERMISSION_KEY)[keyof typeof PERMISSION_KEY];

export const PERMISSION_KEYS = Object.values(PERMISSION_KEY) as [
  PermissionKey,
  ...PermissionKey[],
];

// ─── Permission Actions ───────────────────────────────────────────────────────
// Actions form a strict hierarchy — higher levels implicitly satisfy lower ones.
//   none → read → write → delete
//     0      1      2       3

export const PERMISSION_ACTION = {
  NONE: "none",
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTION)[keyof typeof PERMISSION_ACTION];

export const PERMISSION_ACTIONS = Object.values(PERMISSION_ACTION) as [
  PermissionAction,
  ...PermissionAction[],
];

// Numeric level for each action — used in authorize() comparisons.
export const ACTION_LEVEL: Record<PermissionAction, number> = {
  none: 0,
  read: 1,
  write: 2,
  delete: 3,
};

// ─── System Roles ─────────────────────────────────────────────────────────────
// System roles are seeded on every server boot and flagged isSystem = true.
// They cannot be deleted or renamed via API.

export const SYSTEM_ROLE = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
} as const;

export type SystemRole = (typeof SYSTEM_ROLE)[keyof typeof SYSTEM_ROLE];

export const SYSTEM_ROLES = Object.values(SYSTEM_ROLE) as [
  SystemRole,
  ...SystemRole[],
];

// ─── System Role Permissions Manifest ────────────────────────────────────────
// This is the single source of truth for what each system role can do.
// The seed script reads this manifest and enforces it in the DB on every boot.
//
// Rules:
//   - System roles always reflect this manifest after boot (DO UPDATE)
//   - Custom roles are never touched by the seed (DO NOTHING)
//   - New permissions default to "none" for all custom roles automatically
//
// ⚠️  When adding a new PERMISSION_KEY, add it to ALL three roles here.

export const SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRole,
  Record<PermissionKey, PermissionAction>
> = {
  super_admin: {
    USER_MANAGEMENT: "delete",
  },
  admin: {
    USER_MANAGEMENT: "write",
  },
  user: {
    USER_MANAGEMENT: "none",
  },
};
