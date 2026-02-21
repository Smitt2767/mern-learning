import { relations } from "drizzle-orm";
import { index, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { organizations } from "./organizations.js";
import { roles } from "./roles.js";
import { users } from "./users.js";

// Junction table — one row per (user, organization) pair.
// roleId points to a role with scope = "organization" and organizationId matching.
// This is enforced in service logic, not at the DB level.

export const organizationMembers = pgTable(
  "organization_members",
  {
    id,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The org-scoped role assigned to this member.
    // scope = "organization", organizationId = this.organizationId (enforced in service)
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    // A user can only be a member of an org once
    unique("uq_org_members_org_user").on(table.organizationId, table.userId),
    index("idx_org_members_organization_id").on(table.organizationId),
    index("idx_org_members_user_id").on(table.userId),
    index("idx_org_members_role_id").on(table.roleId),
  ],
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
    role: one(roles, {
      fields: [organizationMembers.roleId],
      references: [roles.id],
    }),
  }),
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
