import { CacheInvalidate, Cacheable } from "@mern/cache";
import {
  PERMISSION_SCOPE,
  type PermissionAction,
  type PermissionKey,
  type RoleWithPermissions,
} from "@mern/core";
import {
  organizationMembers,
  organizations,
  roles,
  seedOrgRoles,
  type DbInstance,
} from "@mern/database";
import { AppError } from "@mern/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { CacheKeys } from "../cache/keys.js";
import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

export class OrganizationService {
  private constructor() {}

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a new organization, seeds its 3 default roles, and adds the
   * creator as owner — all in a single transaction.
   */
  static async create(
    data: {
      name: string;
      slug: string;
      logo?: string | undefined;
      metadata?: Record<string, unknown> | undefined;
    },
    creatorUserId: string,
    tx: DbInstance = db,
  ) {
    return tx.transaction(async (trx) => {
      // 1. Insert org
      const [org] = await trx
        .insert(organizations)
        .values({
          name: data.name,
          slug: data.slug,
          logo: data.logo ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      if (!org) throw AppError.internal("Failed to create organization");

      // 2. Seed 3 default roles for this org
      const { ownerRoleId } = await seedOrgRoles(org.id, trx);

      // 3. Add creator as owner
      await trx.insert(organizationMembers).values({
        organizationId: org.id,
        userId: creatorUserId,
        roleId: ownerRoleId,
      });

      return org;
    });
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  @Cacheable({
    key: CacheKeys.orgs.bySlug,
    ttl: "oneHour",
    tags: [CacheTags.orgs.byOrgId],
  })
  static async findBySlug(slug: string) {
    return db.query.organizations.findFirst({
      where: and(eq(organizations.slug, slug), isNull(organizations.deletedAt)),
    });
  }

  @Cacheable({
    key: CacheKeys.orgs.byUserId,
    ttl: "thirtyMinutes",
    tags: [CacheTags.orgs.byUserId],
  })
  static async findAllByUserId(userId: string) {
    return db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: {
        organization: true,
        role: true,
      },
    });
  }

  @Cacheable({
    key: CacheKeys.orgs.membersByOrgId,
    ttl: "thirtyMinutes",
    tags: [CacheTags.orgs.byOrgId],
  })
  static async findMembers(orgId: string) {
    return db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, orgId),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        role: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async findMember(orgId: string, userId: string) {
    return db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    });
  }

  static async findOrgRoles(orgId: string) {
    return db.query.roles.findMany({
      where: and(
        eq(roles.organizationId, orgId),
        isNotNull(roles.organizationId),
      ),
      with: {
        rolePermissions: {
          with: { permission: true },
        },
      },
    });
  }

  /**
   * Resolves a named default role (owner/admin/member) for a specific org.
   * Used by InvitationService to resolve roleId from a role name.
   */
  static async findOrgRoleByName(orgId: string, name: string) {
    return db.query.roles.findFirst({
      where: and(eq(roles.organizationId, orgId), eq(roles.name, name)),
    });
  }

  /**
   * Resolves an org-scoped role with its permissions.
   * Only loads role_permissions filtered to scope = "organization".
   * Used by authorizeOrg() callback.
   */
  @Cacheable({
    key: CacheKeys.orgs.roleById,
    ttl: "oneHour",
    tags: [CacheTags.orgs.roleById],
  })
  static async findOrgRoleWithPermissions(
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

    // Only include org-scoped permissions in the resolved map
    const permissions = {} as Record<PermissionKey, PermissionAction>;
    for (const rp of row.rolePermissions) {
      if (rp.permission.scope === PERMISSION_SCOPE.ORGANIZATION) {
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

  static async isSlugTaken(slug: string): Promise<boolean> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      columns: { id: true },
    });
    return !!org;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  @CacheInvalidate({
    tags: [(orgId: string) => CacheTags.orgs.byOrgId(orgId)],
  })
  static async update(
    orgId: string,
    data: Partial<{
      name: string | undefined;
      logo: string | null | undefined;
      metadata: Record<string, unknown> | undefined;
    }>,
    tx: DbInstance = db,
  ) {
    const [updated] = await tx
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, orgId))
      .returning();

    return updated;
  }

  // ─── Member management ─────────────────────────────────────────────────────

  @CacheInvalidate({
    tags: [
      (orgId: string) => CacheTags.orgs.byOrgId(orgId),
      (_orgId: string, userId: string) => CacheTags.orgs.byUserId(userId),
    ],
  })
  static async updateMemberRole(
    orgId: string,
    userId: string,
    newRoleId: string,
    tx: DbInstance = db,
  ) {
    await tx
      .update(organizationMembers)
      .set({ roleId: newRoleId, updatedAt: new Date() })
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId),
        ),
      );
  }

  @CacheInvalidate({
    tags: [
      (orgId: string) => CacheTags.orgs.byOrgId(orgId),
      (_orgId: string, userId: string) => CacheTags.orgs.byUserId(userId),
    ],
  })
  static async removeMember(
    orgId: string,
    userId: string,
    tx: DbInstance = db,
  ) {
    await tx
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId),
        ),
      );
  }

  /**
   * Transfers ownership from one user to another atomically.
   * Swaps roles: old owner gets admin role, new owner gets owner role.
   */
  static async transferOwnership(
    orgId: string,
    fromUserId: string,
    toUserId: string,
    tx: DbInstance = db,
  ) {
    return tx.transaction(async (trx) => {
      const ownerRole = await OrganizationService.findOrgRoleByName(
        orgId,
        "owner",
      );
      const adminRole = await OrganizationService.findOrgRoleByName(
        orgId,
        "admin",
      );

      if (!ownerRole || !adminRole) {
        throw AppError.internal("Default org roles not found");
      }

      // Demote current owner to admin
      await OrganizationService.updateMemberRole(
        orgId,
        fromUserId,
        adminRole.id,
        trx,
      );

      // Promote new owner
      await OrganizationService.updateMemberRole(
        orgId,
        toUserId,
        ownerRole.id,
        trx,
      );
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  @CacheInvalidate({
    tags: [(orgId: string) => CacheTags.orgs.byOrgId(orgId)],
  })
  static async softDelete(orgId: string, tx: DbInstance = db) {
    await tx
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(organizations.id, orgId));
  }
}
