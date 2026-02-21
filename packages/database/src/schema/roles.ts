import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { rolePermissions } from "./role-permissions.js";
import { users } from "./users.js";

// Roles are either seeded system roles (isSystem = true) or created via API.
// System roles cannot be deleted or renamed via API.

export const roles = pgTable(
  "roles",
  {
    id,
    name: varchar({ length: 100 }).notNull().unique(),
    description: text().notNull().default(""),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("idx_roles_name").on(table.name),
    index("idx_roles_is_system").on(table.isSystem),
  ],
);

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  users: many(users),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
