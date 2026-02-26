import { CacheInvalidate } from "@mern/cache";
import {
  organizationInvitations,
  organizationMembers,
  organizations,
  roles,
} from "@mern/database";
import { count, desc, eq, isNull } from "drizzle-orm";

import { CacheTags } from "../cache/tags.js";
import { db } from "../config/db.js";

// admin-server has read-only visibility into all orgs across the platform,
// plus a force-delete capability for abuse/policy enforcement.
// It never creates, updates, or seeds org roles — that belongs to main-server.

export class OrganizationService {
  private constructor() {}

  /**
   * findAll — paginated list of all non-deleted orgs across the platform.
   * Includes member count and owner email for at-a-glance admin overview.
   */
  static async findAll({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;

    const [rows, [countResult]] = await Promise.all([
      db.query.organizations.findMany({
        where: isNull(organizations.deletedAt),
        orderBy: [desc(organizations.createdAt)],
        limit,
        offset,
        with: {
          organizationMembers: {
            columns: { userId: true },
          },
        },
      }),
      db
        .select({ total: count() })
        .from(organizations)
        .where(isNull(organizations.deletedAt)),
    ]);

    // Attach member count per org
    const orgs = rows.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logo,
      metadata: org.metadata,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      memberCount: org.organizationMembers.length,
    }));

    return {
      organizations: orgs,
      total: Number(countResult?.total ?? 0),
      page,
      limit,
    };
  }

  /**
   * findByIdForAdmin — full org detail with members (user + role) and
   * pending invitation count. Used for the platform admin detail view.
   */
  static async findByIdForAdmin(orgId: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      with: {
        organizationMembers: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
                status: true,
              },
            },
            role: {
              columns: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!org) return null;

    // Pending invitation count — separate query to keep it clean
    const [inviteCount] = await db
      .select({ total: count() })
      .from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, orgId));

    return {
      ...org,
      pendingInvitationCount: Number(inviteCount?.total ?? 0),
    };
  }

  /**
   * forceDelete — hard-deletes an org and all its dependent rows in a
   * single transaction. Used for abuse/policy enforcement only.
   *
   * Cascade order:
   *   1. org_invitations  (references organizations)
   *   2. org_members      (references organizations + roles)
   *   3. org roles        (scope = 'organization', organizationId = orgId)
   *   4. organizations    (the org itself)
   *
   * Invalidates the org cache tag so stale entries are cleared from Redis.
   */
  @CacheInvalidate({ tags: [CacheTags.orgs.byOrgId] })
  static async forceDelete(orgId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Invitations
      await tx
        .delete(organizationInvitations)
        .where(eq(organizationInvitations.organizationId, orgId));

      // 2. Members
      await tx
        .delete(organizationMembers)
        .where(eq(organizationMembers.organizationId, orgId));

      // 3. Org-scoped roles (seeded per-org: owner, admin, member)
      await tx.delete(roles).where(eq(roles.organizationId, orgId));

      // 4. Org itself
      await tx.delete(organizations).where(eq(organizations.id, orgId));
    });
  }
}
