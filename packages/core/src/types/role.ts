import type { PermissionAction, PermissionKey } from "../constants/rbac.js";

// ─── Permission ───────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  key: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Role with resolved permissions ───────────────────────────────────────────
// This is the shape attached to req.user.role at authentication time.
// Permissions are stored as a flat map for O(1) lookup in authorize().

export interface RoleWithPermissions extends Role {
  permissions: Record<PermissionKey, PermissionAction>;
}
