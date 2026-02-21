import { Cacheable } from "@mern/cache";
import {
  SYSTEM_ROLE,
  type PermissionAction,
  type PermissionKey,
  type RoleWithPermissions,
} from "@mern/core";
import { roles } from "@mern/database";
import { AppError } from "@mern/server";
import { eq } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

// Module-level in-memory cache for the default user role ID.
// Populated on first call, reused for every subsequent signup/OAuth.
let defaultUserRoleId: string | null = null;

export class RoleService {
  private constructor() {}

  @Cacheable({
    key: CacheKeys.roles.byId,
    ttl: "oneHour",
    tags: [CacheTags.roles.byId],
  })
  static async findWithPermissions(
    roleId: string,
  ): Promise<RoleWithPermissions | null> {
    const row = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!row) return null;

    const permissions = {} as Record<PermissionKey, PermissionAction>;
    for (const rp of row.rolePermissions) {
      permissions[rp.permission.key as PermissionKey] =
        rp.action as PermissionAction;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      permissions,
    };
  }

  // Looks up the default "user" system role ID.
  // Result is memoized in memory — safe because system role IDs never change.
  static async findDefaultUserRoleId(): Promise<string> {
    if (defaultUserRoleId) return defaultUserRoleId;

    const role = await db.query.roles.findFirst({
      where: eq(roles.name, SYSTEM_ROLE.USER),
    });

    if (!role) {
      throw AppError.internal(
        "Default 'user' role not found. Run the RBAC seed first.",
      );
    }

    defaultUserRoleId = role.id;
    return defaultUserRoleId;
  }
}
