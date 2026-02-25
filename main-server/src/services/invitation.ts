import {
  INVITATION_EXPIRY_HOURS,
  INVITATION_STATUS,
  JOB_NAME,
} from "@mern/core";
import {
  organizationInvitations,
  organizationMembers,
  type DbInstance,
} from "@mern/database";
import { QueueManager } from "@mern/queue";
import { AppError } from "@mern/server";
import { and, eq, lt } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../config/db.js";

export class InvitationService {
  private constructor() {}

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a pending invitation and enqueues the invitation email.
   * Prevents duplicate pending invites for the same email + org pair.
   */
  static async create(
    orgId: string,
    invitedById: string,
    email: string,
    roleId: string,
    tx: DbInstance = db,
  ) {
    // Guard: no duplicate pending invite for this email in this org
    const existing = await tx.query.organizationInvitations.findFirst({
      where: and(
        eq(organizationInvitations.organizationId, orgId),
        eq(organizationInvitations.email, email),
        eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
      ),
    });

    if (existing) {
      throw AppError.conflict(
        "A pending invitation already exists for this email",
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const [invitation] = await tx
      .insert(organizationInvitations)
      .values({
        organizationId: orgId,
        email,
        roleId,
        invitedById,
        token,
        status: INVITATION_STATUS.PENDING,
        expiresAt,
      })
      .returning();

    if (!invitation) throw AppError.internal("Failed to create invitation");

    // Fetch details needed for the email job
    const full = await InvitationService.findByToken(token);
    if (!full) throw AppError.internal("Failed to fetch created invitation");

    void QueueManager.add(
      JOB_NAME.SEND_ORG_INVITATION_EMAIL,
      {
        invitationId: invitation.id,
        organizationName: full.organization.name,
        organizationSlug: full.organization.slug,
        invitedByName: `${full.invitedBy.firstName} ${full.invitedBy.lastName}`,
        inviteeEmail: email,
        roleName: full.role.name,
        token,
        expiresAt: expiresAt.toISOString(),
      },
      { priority: 5 },
    );

    return invitation;
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  static async findByToken(token: string) {
    return db.query.organizationInvitations.findFirst({
      where: eq(organizationInvitations.token, token),
      with: {
        organization: {
          columns: { id: true, name: true, slug: true, logo: true },
        },
        role: {
          columns: { id: true, name: true },
        },
        invitedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async findAllByOrg(orgId: string) {
    return db.query.organizationInvitations.findMany({
      where: eq(organizationInvitations.organizationId, orgId),
      with: {
        role: { columns: { id: true, name: true } },
        invitedBy: {
          columns: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  static async cancel(invitationId: string, tx: DbInstance = db) {
    const [updated] = await tx
      .update(organizationInvitations)
      .set({ status: INVITATION_STATUS.CANCELLED, updatedAt: new Date() })
      .where(
        and(
          eq(organizationInvitations.id, invitationId),
          eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
        ),
      )
      .returning();

    if (!updated) {
      throw AppError.notFound("Invitation not found or already resolved");
    }

    return updated;
  }

  static async reject(token: string, tx: DbInstance = db) {
    const [updated] = await tx
      .update(organizationInvitations)
      .set({ status: INVITATION_STATUS.CANCELLED, updatedAt: new Date() })
      .where(
        and(
          eq(organizationInvitations.token, token),
          eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
        ),
      )
      .returning();

    if (!updated) {
      throw AppError.notFound("Invitation not found or already resolved");
    }

    return updated;
  }

  /**
   * Accepts an invitation by token.
   * Validates the token is still pending and not expired, adds the user as a
   * member, marks the invitation accepted, and enqueues the joined email.
   * All done in a single transaction.
   */
  static async accept(token: string, userId: string, tx: DbInstance = db) {
    return tx.transaction(async (trx) => {
      const invitation = await trx.query.organizationInvitations.findFirst({
        where: and(
          eq(organizationInvitations.token, token),
          eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
        ),
        with: {
          organization: {
            columns: { id: true, name: true, slug: true },
          },
          role: { columns: { id: true, name: true } },
        },
      });

      if (!invitation) {
        throw AppError.notFound("Invitation not found or already resolved");
      }

      if (invitation.expiresAt < new Date()) {
        await trx
          .update(organizationInvitations)
          .set({ status: INVITATION_STATUS.EXPIRED, updatedAt: new Date() })
          .where(eq(organizationInvitations.id, invitation.id));

        throw AppError.badRequest("Invitation has expired");
      }

      // Guard: user already a member
      const existing = await trx.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, invitation.organizationId),
          eq(organizationMembers.userId, userId),
        ),
      });

      if (existing) {
        // Silently mark accepted and return — idempotent
        await trx
          .update(organizationInvitations)
          .set({ status: INVITATION_STATUS.ACCEPTED, updatedAt: new Date() })
          .where(eq(organizationInvitations.id, invitation.id));

        return invitation;
      }

      // Add member
      await trx.insert(organizationMembers).values({
        organizationId: invitation.organizationId,
        userId,
        roleId: invitation.roleId,
      });

      // Mark accepted
      await trx
        .update(organizationInvitations)
        .set({ status: INVITATION_STATUS.ACCEPTED, updatedAt: new Date() })
        .where(eq(organizationInvitations.id, invitation.id));

      return invitation;
    });
  }

  /**
   * Auto-accepts all pending invitations for a given email.
   * Called after signup or login when email matches.
   * Fires-and-forgets the member joined email for each accepted invite.
   */
  static async autoAcceptPendingByEmail(
    email: string,
    userId: string,
  ): Promise<void> {
    const pending = await db.query.organizationInvitations.findMany({
      where: and(
        eq(organizationInvitations.email, email),
        eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
      ),
      with: {
        organization: { columns: { id: true, name: true, slug: true } },
        role: { columns: { id: true, name: true } },
      },
    });

    if (pending.length === 0) return;

    for (const invitation of pending) {
      try {
        await InvitationService.accept(invitation.token, userId);

        // Fetch org admins/owners to notify
        const adminMembers = await db.query.organizationMembers.findMany({
          where: eq(
            organizationMembers.organizationId,
            invitation.organizationId,
          ),
          with: {
            user: { columns: { email: true, firstName: true, lastName: true } },
            role: { columns: { name: true } },
          },
        });

        const notifyEmails = adminMembers
          .filter((m) => ["owner", "admin"].includes(m.role.name))
          .map((m) => m.user.email);

        void QueueManager.add(
          JOB_NAME.SEND_ORG_MEMBER_JOINED_EMAIL,
          {
            organizationName: invitation.organization.name,
            organizationSlug: invitation.organization.slug,
            // Full name resolved by mail-server from userId if needed;
            // email is used as fallback display name here.
            newMemberName: email,
            newMemberEmail: email,
            roleName: invitation.role.name,
            notifyEmails,
          },
          { priority: 10 },
        );
      } catch {
        // Non-fatal — log but don't block login/signup
      }
    }
  }

  /**
   * Marks all pending invitations whose expiresAt has passed as expired.
   * Called by the maintenance cron job.
   */
  static async expireStale(tx: DbInstance = db): Promise<number> {
    const result = await tx
      .update(organizationInvitations)
      .set({ status: INVITATION_STATUS.EXPIRED, updatedAt: new Date() })
      .where(
        and(
          eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
          lt(organizationInvitations.expiresAt, new Date()),
        ),
      )
      .returning({ id: organizationInvitations.id });

    return result.length;
  }
}
