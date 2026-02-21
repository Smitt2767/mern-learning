import { relations } from "drizzle-orm";
import { index, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { permissionActionEnum } from "./enums.js";
import { permissions } from "./permissions.js";
import { roles } from "./roles.js";

// Junction table — one row per (role, permission) pair.
// action follows the hierarchy: none < read < write < delete
// System role actions are overwritten by the seed on every boot.
// Custom role actions are never touched by the seed.

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id,
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    action: permissionActionEnum().notNull().default("none"),
    createdAt,
    updatedAt,
  },
  (table) => [
    unique("uq_role_permissions").on(table.roleId, table.permissionId),
    index("idx_role_permissions_role_id").on(table.roleId),
    index("idx_role_permissions_permission_id").on(table.permissionId),
  ],
);

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
