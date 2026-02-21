import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { invitationStatusEnum } from "./enums.js";
import { organizations } from "./organizations.js";
import { roles } from "./roles.js";
import { users } from "./users.js";

// An invitation is sent to an email address to join an organization.
//
// Token lifecycle:
//   - Generated on creation, expires after INVITATION_EXPIRY_HOURS (72h)
//   - Used only for invite preview page — NOT required to accept
//   - Acceptance is triggered by email match on signup/login
//
// Status transitions:
//   pending → accepted   (autoAcceptPendingByEmail on signup/login)
//   pending → cancelled  (admin/owner cancels, or invitee rejects)
//   pending → expired    (maintenance cron job marks stale invites)

export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar({ length: 255 }).notNull(),
    // The org-scoped role the invitee will be assigned on accepting.
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    // The user who sent the invite.
    invitedById: uuid("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Unique opaque token — used to build the invite preview URL.
    token: varchar({ length: 255 }).notNull().unique(),
    status: invitationStatusEnum().notNull().default("pending"),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("idx_org_invitations_token").on(table.token),
    index("idx_org_invitations_email").on(table.email),
    index("idx_org_invitations_organization_id").on(table.organizationId),
    index("idx_org_invitations_status").on(table.status),
    // Composite — most common lookup: "pending invites for this email"
    index("idx_org_invitations_email_status").on(table.email, table.status),
  ],
);

export const organizationInvitationsRelations = relations(
  organizationInvitations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationInvitations.organizationId],
      references: [organizations.id],
    }),
    role: one(roles, {
      fields: [organizationInvitations.roleId],
      references: [roles.id],
    }),
    invitedBy: one(users, {
      fields: [organizationInvitations.invitedById],
      references: [users.id],
    }),
  }),
);

export type OrganizationInvitation =
  typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation =
  typeof organizationInvitations.$inferInsert;
