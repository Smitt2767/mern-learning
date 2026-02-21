import { Logger } from "@mern/logger";

import type { PermissionKey } from "@mern/core";
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
  USER_MANAGEMENT:
    "Manage platform users — view profiles, update status, assign roles, delete accounts",
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
 *     New permission row is inserted. System roles receive the action from
 *     SYSTEM_ROLE_PERMISSIONS manifest. Custom roles receive "none" (safe default).
 *
 *   Scenario 3 — New system role added to SYSTEM_ROLE in @mern/core
 *     New role row is inserted. All existing permissions are assigned from manifest.
 *
 *   Scenario 4 — System role manifest action changed in @mern/core
 *     ON CONFLICT DO UPDATE overwrites the action for system roles only.
 *     Custom role permission assignments are NEVER touched by this seed.
 *
 * @param db - Drizzle DB instance (or transaction)
 */
export async function seedRbac(db: DbInstance): Promise<void> {
  Logger.info("[seed] Running RBAC seed…");

  await db.transaction(async (tx) => {
    // ── Step 1: Upsert all permissions ────────────────────────────────────────
    // New permissions are inserted. Existing ones are skipped (DO NOTHING).
    // Description is not updated on conflict — set once at creation.

    const permissionValues = PERMISSION_KEYS.map((key) => ({
      key,
      description: PERMISSION_DESCRIPTIONS[key] ?? key,
    }));

    await tx
      .insert(permissions)
      .values(permissionValues)
      .onConflictDoNothing({ target: permissions.key });

    Logger.info(`[seed] Permissions upserted (${permissionValues.length})`);

    // ── Step 2: Upsert system roles ───────────────────────────────────────────
    // New system roles are inserted. Existing ones are skipped (DO NOTHING).
    // isSystem = true is intentionally not updated on conflict — if someone
    // manually set it to false, we don't silently re-elevate it here.

    const roleValues = SYSTEM_ROLES.map((name) => ({
      name,
      description: SYSTEM_ROLE_DESCRIPTIONS[name] ?? name,
      isSystem: true,
    }));

    await tx
      .insert(roles)
      .values(roleValues)
      .onConflictDoNothing({ target: roles.name });

    Logger.info(`[seed] System roles upserted (${roleValues.length})`);

    // ── Step 3: Fetch current state from DB ───────────────────────────────────
    // We need actual UUIDs to build role_permissions rows.

    const allPermissions = await tx.select().from(permissions);
    const allRoles = await tx.select().from(roles);

    // ── Step 4: Upsert role_permissions ───────────────────────────────────────
    //
    // System roles (isSystem = true):
    //   ON CONFLICT DO UPDATE → always reflects the manifest.
    //   This is how manifest changes propagate on deploy.
    //
    // Custom roles (isSystem = false):
    //   ON CONFLICT DO NOTHING → admin-managed assignments are never touched.
    //   New permissions get action = "none" as a safe default.

    for (const role of allRoles) {
      for (const permission of allPermissions) {
        if (role.isSystem) {
          // Resolve action from manifest. Falls back to "none" if somehow
          // missing (e.g. a permission was added but manifest wasn't updated).
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
          // Custom role — insert with "none" only if the row doesn't exist yet.
          // Never overwrite what an admin has configured.
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
        `(${allRoles.length} roles × ${allPermissions.length} permissions)`,
    );
  });

  Logger.success("[seed] RBAC seed complete.");
}
