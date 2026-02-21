// Manifest is the single source of truth for RBAC seed data.
// It re-exports directly from @mern/core so there is zero duplication.
// When you add a new PERMISSION_KEY or SYSTEM_ROLE, this file needs no changes —
// it automatically picks up whatever is declared in @mern/core.

export {
  DEFAULT_ORG_ROLE_PERMISSIONS,
  PERMISSION_KEY,
  PERMISSION_KEYS,
  PERMISSION_SCOPE,
  PERMISSION_SCOPE_MAP,
  SYSTEM_ROLE,
  SYSTEM_ROLES,
  SYSTEM_ROLE_PERMISSIONS,
} from "@mern/core";
