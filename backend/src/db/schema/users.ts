import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts.js";
import { emailVerifications } from "./email-verifications.js";
import { userRoleEnum, userStatusEnum } from "./enums.js";
import { passwordResetTokens } from "./password-reset-tokens.js";
import { sessions } from "./sessions.js";

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey(),
    firstName: varchar({ length: 100 }).notNull(),
    lastName: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: text(),
    profileImage: text(),
    role: userRoleEnum().default("user").notNull(),
    status: userStatusEnum().default("active").notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true, mode: "date" }),
    lastLoginAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_status").on(table.status),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  emailVerifications: many(emailVerifications),
  passwordResetTokens: many(passwordResetTokens),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
