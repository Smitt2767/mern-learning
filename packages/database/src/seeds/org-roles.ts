import { Logger } from "@mern/logger";

import type { PermissionKey } from "@mern/core";
import { DEFAULT_ORG_ROLE_PERMISSIONS, PERMISSION_SCOPE } from "@mern/core";
import { eq } from "drizzle-orm";
import { permissions, rolePermissions, roles } from "../schema/index.js";
import type { DbInstance } from "../types/index.js";

// ─── Default org role descriptions ───────────────────────────────────────────

const DEFAULT_ORG_ROLE_DESCRIPTIONS: Record<string, string> = {
  owner:
    "Full control over the organization — settings, members, and invitations",
  admin: "Manage members and invitations, update organization settings",
  member: "Standard member — can view the member list",
};

// ─── Return type ─────────────────────────────────────────────────────────────

export interface SeededOrgRoles {
  ownerRoleId: string;
  adminRoleId: string;
  memberRoleId: string;
}

// ─── Seed function ────────────────────────────────────────────────────────────

/**
 * seedOrgRoles
 *
 * Seeds the 3 default org roles (owner, admin, member) for a newly created
 * organization. Must be called inside an existing transaction so the org
 * creation and role seeding are atomic.
 *
 * Returns the IDs of the three seeded roles so the caller can immediately
 * assign the creator as owner without an extra DB lookup.
 *
 * This function is NOT idempotent by design — it should only ever be called
 * once per org (at creation time). The org creation service is responsible
 * for ensuring it is not called twice.
 *
 * @param orgId - The ID of the newly created organization
 * @param tx    - An active Drizzle transaction
 */
export async function seedOrgRoles(
  orgId: string,
  tx: DbInstance,
): Promise<SeededOrgRoles> {
  Logger.info(`[seed:org-roles] Seeding default roles for org ${orgId}…`);

  // ── Step 1: Fetch all org-scoped permissions from DB ──────────────────────
  // These were seeded by seedRbac() at server boot.
  // We only assign org-scoped permissions to org roles.

  const orgPermissions = await tx
    .select()
    .from(permissions)
    .where(eq(permissions.scope, PERMISSION_SCOPE.ORGANIZATION));

  if (orgPermissions.length === 0) {
    throw new Error(
      "[seed:org-roles] No org-scoped permissions found. Run seedRbac() first.",
    );
  }

  // ── Step 2: Insert the 3 default org roles ────────────────────────────────

  const defaultRoleNames = Object.keys(DEFAULT_ORG_ROLE_PERMISSIONS) as Array<
    keyof typeof DEFAULT_ORG_ROLE_PERMISSIONS
  >;

  const insertedRoles = await tx
    .insert(roles)
    .values(
      defaultRoleNames.map((name) => ({
        name,
        description: DEFAULT_ORG_ROLE_DESCRIPTIONS[name] ?? name,
        isSystem: true,
        scope: "organization" as const,
        organizationId: orgId,
      })),
    )
    .returning({ id: roles.id, name: roles.name });

  Logger.info(
    `[seed:org-roles] Inserted ${insertedRoles.length} default org roles`,
  );

  // ── Step 3: Assign permissions to each role ───────────────────────────────
  // Uses the DEFAULT_ORG_ROLE_PERMISSIONS manifest from @mern/core.

  for (const role of insertedRoles) {
    const roleName = role.name as keyof typeof DEFAULT_ORG_ROLE_PERMISSIONS;
    const manifest = DEFAULT_ORG_ROLE_PERMISSIONS[roleName];

    for (const permission of orgPermissions) {
      const action = manifest[permission.key as PermissionKey] ?? "none";

      await tx.insert(rolePermissions).values({
        roleId: role.id,
        permissionId: permission.id,
        action,
      });
    }
  }

  Logger.info(
    `[seed:org-roles] Assigned permissions ` +
      `(${insertedRoles.length} roles × ${orgPermissions.length} permissions)`,
  );

  // ── Step 4: Build and return the role ID map ──────────────────────────────

  const find = (name: string) => {
    const found = insertedRoles.find((r) => r.name === name);
    if (!found)
      throw new Error(`[seed:org-roles] Role "${name}" not found after insert`);
    return found.id;
  };

  const result: SeededOrgRoles = {
    ownerRoleId: find("owner"),
    adminRoleId: find("admin"),
    memberRoleId: find("member"),
  };

  Logger.success(`[seed:org-roles] Done for org ${orgId}`);

  return result;
}
