import type {
  PermissionAction,
  PermissionKey,
  RoleScope,
} from "../constants/rbac.js";

// ─── Permission ───────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  key: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Role ─────────────────────────────────────────────────────────────────────
// Mirrors the `roles` DB row exactly.
//
//   scope = "global"       → platform role, organizationId is null
//   scope = "organization" → org-scoped role, organizationId is set

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  scope: RoleScope;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Role with resolved permissions ───────────────────────────────────────────
// Attached to:
//   req.user.role          → global role, permissions filtered by scope="global"
//   req.organizationMember.role → org role, permissions filtered by scope="organization"
//
// Permissions are a flat map for O(1) lookup in authorize() / authorizeOrg().

export interface RoleWithPermissions extends Role {
  permissions: Record<PermissionKey, PermissionAction>;
}
