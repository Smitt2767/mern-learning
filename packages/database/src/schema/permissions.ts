import { relations } from "drizzle-orm";
import { index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { rolePermissions } from "./role-permissions.js";

// Permissions are seeded from @mern/core PERMISSION_KEY on every server boot.
// They are read-only from the API — never created or deleted by users.

export const permissions = pgTable(
  "permissions",
  {
    id,
    key: varchar({ length: 100 }).notNull().unique(),
    description: text().notNull().default(""),
    createdAt,
    updatedAt,
  },
  (table) => [index("idx_permissions_key").on(table.key)],
);

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
