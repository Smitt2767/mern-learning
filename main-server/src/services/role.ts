import { Cacheable } from "@mern/cache";
import {
  PERMISSION_SCOPE,
  type PermissionAction,
  type PermissionKey,
  type RoleWithPermissions,
} from "@mern/core";
import { roles } from "@mern/database";
import { eq } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

export class RoleService {
  private constructor() {}

  /**
   * Resolves a global-scoped role with its permissions.
   * Filters role_permissions to scope = "global" only — prevents
   * org-scoped permissions from leaking into the global auth context.
   */
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
          with: { permission: true },
        },
      },
    });

    if (!row) return null;

    const permissions = {} as Record<PermissionKey, PermissionAction>;
    for (const rp of row.rolePermissions) {
      if (rp.permission.scope === PERMISSION_SCOPE.GLOBAL) {
        permissions[rp.permission.key as PermissionKey] =
          rp.action as PermissionAction;
      }
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem,
      scope: row.scope,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      permissions,
    };
  }
}
