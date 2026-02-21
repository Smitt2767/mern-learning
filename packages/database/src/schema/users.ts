import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { accounts } from "./accounts.js";
import { emailVerifications } from "./email-verifications.js";
import { userStatusEnum } from "./enums.js";
import { organizationMembers } from "./organization-members.js";
import { passwordResetTokens } from "./password-reset-tokens.js";
import { roles } from "./roles.js";
import { sessions } from "./sessions.js";

export const users = pgTable(
  "users",
  {
    id,
    firstName: varchar({ length: 100 }).notNull(),
    lastName: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: text(),
    profileImage: text(),
    // roleId is nullable — null means no role assigned (e.g. role was deleted).
    // Points to a global-scoped role (scope = "global").
    // Assigned at signup and changeable via admin-server API.
    roleId: uuid("role_id").references(() => roles.id, {
      onDelete: "set null",
    }),
    status: userStatusEnum().default("active").notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true, mode: "date" }),
    lastLoginAt: timestamp({ withTimezone: true, mode: "date" }),
    deactivatedAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_status").on(table.status),
    index("idx_users_role_id").on(table.roleId),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  emailVerifications: many(emailVerifications),
  passwordResetTokens: many(passwordResetTokens),
  organizationMembers: many(organizationMembers),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
