import { INVITATION_STATUS, JOB_NAME } from "@mern/core";
import { organizationInvitations, organizationMembers } from "@mern/database";
import { QueueManager } from "@mern/queue";
import { and, eq } from "drizzle-orm";

import { db } from "../config/db.js";

// auth-server only needs this one method from InvitationService.
// Full invitation CRUD lives in main-server.
// Both servers share the same DB — this just calls into it directly.

export class InvitationService {
  private constructor() {}

  /**
   * autoAcceptPendingByEmail
   *
   * Called after a successful login, OAuth callback, or email verification.
   * Finds all pending invitations for the given email, accepts each one
   * atomically, and enqueues the member-joined notification email.
   *
   * Fire-and-forget — never throws. Errors are swallowed per invite so a
   * bad invite never blocks the auth flow.
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
        await db.transaction(async (trx) => {
          // Re-check inside tx in case of a race
          const inv = await trx.query.organizationInvitations.findFirst({
            where: and(
              eq(organizationInvitations.id, invitation.id),
              eq(organizationInvitations.status, INVITATION_STATUS.PENDING),
            ),
          });

          if (!inv) return;

          if (inv.expiresAt < new Date()) {
            await trx
              .update(organizationInvitations)
              .set({ status: INVITATION_STATUS.EXPIRED, updatedAt: new Date() })
              .where(eq(organizationInvitations.id, inv.id));
            return;
          }

          // Guard: user already a member (idempotent)
          const existing = await trx.query.organizationMembers.findFirst({
            where: and(
              eq(organizationMembers.organizationId, inv.organizationId),
              eq(organizationMembers.userId, userId),
            ),
          });

          if (!existing) {
            await trx.insert(organizationMembers).values({
              organizationId: inv.organizationId,
              userId,
              roleId: inv.roleId,
            });
          }

          await trx
            .update(organizationInvitations)
            .set({ status: INVITATION_STATUS.ACCEPTED, updatedAt: new Date() })
            .where(eq(organizationInvitations.id, inv.id));
        });

        // Notify org admins/owners
        const adminMembers = await db.query.organizationMembers.findMany({
          where: eq(
            organizationMembers.organizationId,
            invitation.organizationId,
          ),
          with: {
            user: { columns: { email: true } },
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
            newMemberName: email,
            newMemberEmail: email,
            roleName: invitation.role.name,
            notifyEmails,
          },
          { priority: 10 },
        );
      } catch {
        // Non-fatal — a bad invite never blocks the auth flow
      }
    }
  }
}
