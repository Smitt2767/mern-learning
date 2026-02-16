import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers.js";
import { users } from "./users.js";

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar({ length: 255 }).notNull().unique(),
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    createdAt,
  },
  (table) => [
    index("idx_email_verifications_user_id").on(table.userId),
    index("idx_email_verifications_token").on(table.token),
  ],
);

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerifications.userId],
      references: [users.id],
    }),
  }),
);

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
