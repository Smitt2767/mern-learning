import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { roleScopeEnum } from "./enums.js";
import { organizationMembers } from "./organization-members.js";
import { organizations } from "./organizations.js";
import { rolePermissions } from "./role-permissions.js";
import { users } from "./users.js";

// Roles live in a single table for both global and org-scoped roles.
//
//   scope = "global"       organizationId = null
//     Seeded system roles: super_admin, admin, user
//     isSystem = true — cannot be deleted or renamed via API
//
//   scope = "organization" organizationId = <org uuid>
//     Seeded per-org defaults: owner, admin, member (isSystem = true)
//     Custom roles created by org admins (isSystem = false)
//
// Unique constraints (partial indexes):
//   Global roles:  UNIQUE(name) WHERE organization_id IS NULL
//   Org roles:     UNIQUE(name, organization_id) WHERE organization_id IS NOT NULL

export const roles = pgTable(
  "roles",
  {
    id,
    name: varchar({ length: 100 }).notNull(),
    description: text().notNull().default(""),
    isSystem: boolean("is_system").notNull().default(false),
    scope: roleScopeEnum().notNull().default("global"),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    createdAt,
    updatedAt,
  },
  (table) => [
    // Partial unique indexes replacing the old global unique on name
    uniqueIndex("uq_roles_name_global")
      .on(table.name)
      .where(sql`${table.organizationId} IS NULL`),
    uniqueIndex("uq_roles_name_org")
      .on(table.name, table.organizationId)
      .where(sql`${table.organizationId} IS NOT NULL`),
    // Regular indexes for common query patterns
    index("idx_roles_scope").on(table.scope),
    index("idx_roles_organization_id").on(table.organizationId),
    index("idx_roles_is_system").on(table.isSystem),
  ],
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
  users: many(users),
  organizationMembers: many(organizationMembers),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
