import { Logger } from "@mern/logger";

import type { PermissionKey } from "@mern/core";
import { PERMISSION_SCOPE, PERMISSION_SCOPE_MAP } from "@mern/core";
import { isNull, sql } from "drizzle-orm";
import { permissions, rolePermissions, roles } from "../schema/index.js";
import type { DbInstance } from "../types/index.js";
import {
  PERMISSION_KEYS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_PERMISSIONS,
} from "./manifest.js";

// ─── Permission descriptions ───────────────────────────────────────────────────
// Human-readable descriptions for each permission key.
// Add a description here when you add a new PERMISSION_KEY to @mern/core.

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Global
  USER_MANAGEMENT:
    "Manage platform users — view profiles, update status, assign roles, delete accounts",
  // Organization-scoped
  ORG_MANAGEMENT:
    "Manage organization settings — update details, delete org, transfer ownership",
  MEMBER_MANAGEMENT:
    "Manage organization members — view, add, remove, and update member roles",
  INVITATION_MANAGEMENT:
    "Manage organization invitations — send, list, and cancel invites",
};

// ─── System role descriptions ─────────────────────────────────────────────────

const SYSTEM_ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Full unrestricted access to all system resources",
  admin: "Administrative access with write permissions on managed resources",
  user: "Standard user with read-only or no access to admin resources",
};

// ─── Seed function ────────────────────────────────────────────────────────────

/**
 * seedRbac
 *
 * Idempotent RBAC seed — safe to run on every server boot.
 *
 * Handles all scenarios atomically in a single transaction:
 *
 *   Scenario 1 — Fresh install
 *     All permissions, system roles, and role_permissions are created.
 *
 *   Scenario 2 — New permission added to PERMISSION_KEY in @mern/core
 *     New permission row is inserted. Global system roles receive the action
 *     from SYSTEM_ROLE_PERMISSIONS manifest. Custom global roles receive "none".
 *     Org roles are NOT touched — seedOrgRoles() handles org permission assignment.
 *
 *   Scenario 3 — New system role added to SYSTEM_ROLE in @mern/core
 *     New role row is inserted. All global permissions assigned from manifest.
 *
 *   Scenario 4 — System role manifest action changed in @mern/core
 *     ON CONFLICT DO UPDATE overwrites the action for system roles only.
 *     Custom role permission assignments are NEVER touched by this seed.
 *
 * Note: This seed only operates on global-scoped roles (organizationId IS NULL).
 * Org-scoped roles are created per-org via seedOrgRoles() at org creation time.
 *
 * @param db - Drizzle DB instance (or transaction)
 */
export async function seedRbac(db: DbInstance): Promise<void> {
  Logger.info("[seed] Running RBAC seed…");

  await db.transaction(async (tx) => {
    // ── Step 1: Upsert all permissions ────────────────────────────────────────
    // New permissions are inserted with their correct scope.
    // Existing ones update their scope in case it changed in @mern/core.

    const permissionValues = PERMISSION_KEYS.map((key) => ({
      key,
      description: PERMISSION_DESCRIPTIONS[key] ?? key,
      scope: PERMISSION_SCOPE_MAP[key],
    }));

    await tx
      .insert(permissions)
      .values(permissionValues)
      .onConflictDoUpdate({
        target: permissions.key,
        // Update scope if it changed — description is set once at creation.
        set: { scope: sql`excluded.scope` },
      });

    Logger.info(`[seed] Permissions upserted (${permissionValues.length})`);

    // ── Step 2: Upsert global system roles ────────────────────────────────────
    // Only operates on global roles (organizationId IS NULL, scope = "global").
    // isSystem = true is intentionally not updated on conflict.

    const roleValues = SYSTEM_ROLES.map((name) => ({
      name,
      description: SYSTEM_ROLE_DESCRIPTIONS[name] ?? name,
      isSystem: true,
      scope: PERMISSION_SCOPE.GLOBAL,
      organizationId: null,
    }));

    // onConflictDoNothing uses the partial unique index uq_roles_name_global
    // which only applies WHERE organization_id IS NULL.
    await tx.insert(roles).values(roleValues).onConflictDoNothing();

    Logger.info(`[seed] Global system roles upserted (${roleValues.length})`);

    // ── Step 3: Fetch current global state from DB ────────────────────────────
    // We need actual UUIDs to build role_permissions rows.
    // Only fetch global roles — org roles are managed by seedOrgRoles().

    const allPermissions = await tx.select().from(permissions);
    const globalRoles = await tx
      .select()
      .from(roles)
      .where(isNull(roles.organizationId));

    // ── Step 4: Upsert role_permissions for global roles ──────────────────────
    //
    // System roles (isSystem = true):
    //   ON CONFLICT DO UPDATE → always reflects the manifest.
    //
    // Custom global roles (isSystem = false):
    //   ON CONFLICT DO NOTHING → admin-managed assignments are never touched.
    //   New permissions get action = "none" as a safe default.

    for (const role of globalRoles) {
      for (const permission of allPermissions) {
        if (role.isSystem) {
          const systemRoleName =
            role.name as keyof typeof SYSTEM_ROLE_PERMISSIONS;
          const action =
            SYSTEM_ROLE_PERMISSIONS[systemRoleName]?.[
              permission.key as PermissionKey
            ] ?? "none";

          await tx
            .insert(rolePermissions)
            .values({
              roleId: role.id,
              permissionId: permission.id,
              action,
            })
            .onConflictDoUpdate({
              target: [rolePermissions.roleId, rolePermissions.permissionId],
              set: { action },
            });
        } else {
          await tx
            .insert(rolePermissions)
            .values({
              roleId: role.id,
              permissionId: permission.id,
              action: "none",
            })
            .onConflictDoNothing({
              target: [rolePermissions.roleId, rolePermissions.permissionId],
            });
        }
      }
    }

    Logger.info(
      `[seed] Role permissions upserted ` +
        `(${globalRoles.length} global roles × ${allPermissions.length} permissions)`,
    );
  });

  Logger.success("[seed] RBAC seed complete.");
}
