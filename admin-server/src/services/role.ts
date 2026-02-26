import { CacheInvalidate, Cacheable } from "@mern/cache";
import {
  type PermissionAction,
  type PermissionKey,
  type RoleScope,
  type RoleWithPermissions,
} from "@mern/core";
import {
  permissions,
  rolePermissions,
  roles,
  type NewRole,
} from "@mern/database";
import { AppError } from "@mern/server";
import { asc, eq } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

// ─── Shared helper ────────────────────────────────────────────────────────────

function buildRoleWithPermissions(row: {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  scope: RoleScope;
  organizationId: string | null;
  rolePermissions: Array<{
    action: string;
    permission: { key: string };
  }>;
}): RoleWithPermissions {
  const permissionsMap = {} as Record<PermissionKey, PermissionAction>;
  for (const rp of row.rolePermissions) {
    permissionsMap[rp.permission.key as PermissionKey] =
      rp.action as PermissionAction;
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scope: row.scope,
    organizationId: row.organizationId,
    permissions: permissionsMap,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class RoleService {
  private constructor() {}

  static async findAll(): Promise<RoleWithPermissions[]> {
    const rows = await db.query.roles.findMany({
      with: {
        rolePermissions: {
          with: { permission: true },
        },
      },
      orderBy: [asc(roles.name)],
    });
    return rows.map(buildRoleWithPermissions);
  }

  @Cacheable({
    key: CacheKeys.roles.byId,
    ttl: "oneHour",
    tags: [CacheTags.roles.byId],
  })
  static async findById(roleId: string): Promise<RoleWithPermissions | null> {
    const row = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        rolePermissions: {
          with: { permission: true },
        },
      },
    });
    if (!row) return null;
    return buildRoleWithPermissions(row);
  }

  static async create(
    data: Pick<NewRole, "name" | "description">,
  ): Promise<RoleWithPermissions> {
    const [role] = await db
      .insert(roles)
      .values({ ...data, isSystem: false })
      .returning();
    // Newly created roles have no role_permissions rows yet — defaults to empty

    return {
      id: role!.id,
      name: role!.name,
      description: role!.description,
      isSystem: role!.isSystem,
      createdAt: role!.createdAt,
      updatedAt: role!.updatedAt,
      organizationId: role!.organizationId,
      scope: role!.scope,
      permissions: {} as Record<PermissionKey, PermissionAction>,
    };
  }

  @CacheInvalidate({ tags: [CacheTags.roles.byId] })
  static async update(
    roleId: string,
    data: { name?: string | undefined; description?: string | undefined },
  ): Promise<void> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { id: true, isSystem: true },
    });
    if (!role) throw AppError.notFound("Role not found");
    if (role.isSystem)
      throw AppError.forbidden("System roles cannot be modified");

    await db.update(roles).set(data).where(eq(roles.id, roleId));
  }

  @CacheInvalidate({ tags: [CacheTags.roles.byId] })
  static async setPermissions(
    roleId: string,
    permissionsMap: Partial<Record<PermissionKey, PermissionAction>>,
  ): Promise<void> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { id: true, isSystem: true },
    });
    if (!role) throw AppError.notFound("Role not found");
    if (role.isSystem)
      throw AppError.forbidden(
        "System role permissions cannot be modified via API",
      );

    const allPermissions = await db.select().from(permissions);

    await db.transaction(async (tx) => {
      for (const perm of allPermissions) {
        const action: PermissionAction =
          permissionsMap[perm.key as PermissionKey] ?? "none";
        await tx
          .insert(rolePermissions)
          .values({ roleId, permissionId: perm.id, action })
          .onConflictDoUpdate({
            target: [rolePermissions.roleId, rolePermissions.permissionId],
            set: { action },
          });
      }
    });
  }

  @CacheInvalidate({ tags: [CacheTags.roles.byId] })
  static async delete(roleId: string): Promise<void> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { id: true, isSystem: true },
    });
    if (!role) throw AppError.notFound("Role not found");
    if (role.isSystem)
      throw AppError.forbidden("System roles cannot be deleted");

    await db.delete(roles).where(eq(roles.id, roleId));
  }
}
