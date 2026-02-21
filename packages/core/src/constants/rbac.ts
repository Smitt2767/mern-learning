// ─── Permission Scope ─────────────────────────────────────────────────────────
// Every permission belongs to exactly one scope.
//
//   global       → checked by authorize() middleware on platform/admin routes
//   organization → checked by authorizeOrg() middleware on org-scoped routes
//
// This hard boundary prevents accidentally protecting a global route with an
// org permission or vice versa.

export const PERMISSION_SCOPE = {
  GLOBAL: "global",
  ORGANIZATION: "organization",
} as const;

export type PermissionScope =
  (typeof PERMISSION_SCOPE)[keyof typeof PERMISSION_SCOPE];

/** Tuple — required by pgEnum */
export const PERMISSION_SCOPES = Object.values(PERMISSION_SCOPE) as [
  PermissionScope,
  ...PermissionScope[],
];

// ─── Role Scope ───────────────────────────────────────────────────────────────
// Every role belongs to exactly one scope.
//
//   global       → platform roles (super_admin, admin, user) stored in `roles`
//                  with organizationId = null
//   organization → per-org roles stored in `roles` with organizationId = <uuid>

export const ROLE_SCOPE = {
  GLOBAL: "global",
  ORGANIZATION: "organization",
} as const;

export type RoleScope = (typeof ROLE_SCOPE)[keyof typeof ROLE_SCOPE];

/** Tuple — required by pgEnum */
export const ROLE_SCOPES = Object.values(ROLE_SCOPE) as [
  RoleScope,
  ...RoleScope[],
];

// ─── Permission Keys ──────────────────────────────────────────────────────────
// Each key represents a named resource that can be acted upon.
//
// ⚠️  When adding a new key:
//   1. Add it here
//   2. Add its scope to PERMISSION_SCOPE_MAP below
//   3. Add it to EVERY entry in SYSTEM_ROLE_PERMISSIONS (global roles)
//   4. If org-scoped, add it to EVERY entry in DEFAULT_ORG_ROLE_PERMISSIONS

export const PERMISSION_KEY = {
  // ── Global permissions ────────────────────────────────────────────────────
  USER_MANAGEMENT: "USER_MANAGEMENT",

  // ── Organization permissions ──────────────────────────────────────────────
  ORG_MANAGEMENT: "ORG_MANAGEMENT",
  MEMBER_MANAGEMENT: "MEMBER_MANAGEMENT",
  INVITATION_MANAGEMENT: "INVITATION_MANAGEMENT",
} as const;

export type PermissionKey =
  (typeof PERMISSION_KEY)[keyof typeof PERMISSION_KEY];

export const PERMISSION_KEYS = Object.values(PERMISSION_KEY) as [
  PermissionKey,
  ...PermissionKey[],
];

// ─── Permission Scope Map ─────────────────────────────────────────────────────
// Single source of truth for which scope each permission belongs to.
// Used by seedRbac() to set the scope column, and by middleware to assert
// the correct middleware is being used for the correct permission.

export const PERMISSION_SCOPE_MAP: Record<PermissionKey, PermissionScope> = {
  USER_MANAGEMENT: "global",
  ORG_MANAGEMENT: "organization",
  MEMBER_MANAGEMENT: "organization",
  INVITATION_MANAGEMENT: "organization",
};

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

/** Numeric level for each action — used in authorize() / authorizeOrg() comparisons */
export const ACTION_LEVEL: Record<PermissionAction, number> = {
  none: 0,
  read: 1,
  write: 2,
  delete: 3,
};

// ─── System Roles (Global) ────────────────────────────────────────────────────
// Seeded on every server boot with scope = "global", organizationId = null.
// Cannot be deleted or renamed via API.

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
// Single source of truth for global role permissions.
// seedRbac() enforces this on every boot (DO UPDATE for system roles).
//
// ⚠️  Org-scoped permissions (ORG_MANAGEMENT, MEMBER_MANAGEMENT,
//     INVITATION_MANAGEMENT) are listed here as "none" for all global roles.
//     They are intentionally meaningless at the global level — authorizeOrg()
//     resolves them from the org role, not the global role.

export const SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRole,
  Record<PermissionKey, PermissionAction>
> = {
  super_admin: {
    // Global
    USER_MANAGEMENT: "delete",
    // Org-scoped (not applicable — set to none)
    ORG_MANAGEMENT: "none",
    MEMBER_MANAGEMENT: "none",
    INVITATION_MANAGEMENT: "none",
  },
  admin: {
    USER_MANAGEMENT: "write",
    ORG_MANAGEMENT: "none",
    MEMBER_MANAGEMENT: "none",
    INVITATION_MANAGEMENT: "none",
  },
  user: {
    USER_MANAGEMENT: "none",
    ORG_MANAGEMENT: "none",
    MEMBER_MANAGEMENT: "none",
    INVITATION_MANAGEMENT: "none",
  },
};

// ─── Default Org Role Permissions Manifest ────────────────────────────────────
// Single source of truth for the 3 default org roles seeded into every new org.
// seedOrgRoles() uses this manifest when creating a new organization.
//
// Only org-scoped permissions appear here — global permissions are irrelevant
// to org role assignments.
//
// ⚠️  When adding a new org-scoped PERMISSION_KEY, add it to all 3 roles here.

export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<
  "owner" | "admin" | "member",
  Partial<Record<PermissionKey, PermissionAction>>
> = {
  owner: {
    ORG_MANAGEMENT: "delete",
    MEMBER_MANAGEMENT: "delete",
    INVITATION_MANAGEMENT: "delete",
  },
  admin: {
    ORG_MANAGEMENT: "write",
    MEMBER_MANAGEMENT: "write",
    INVITATION_MANAGEMENT: "write",
  },
  member: {
    ORG_MANAGEMENT: "none",
    MEMBER_MANAGEMENT: "read",
    INVITATION_MANAGEMENT: "none",
  },
};
