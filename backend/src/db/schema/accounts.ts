import { relations } from "drizzle-orm";
import { index, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers.js";
import { accountProviderEnum } from "./enums.js";
import { users } from "./users.js";

export const accounts = pgTable(
  "accounts",
  {
    id,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: accountProviderEnum().notNull(),
    providerAccountId: varchar({ length: 255 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    unique("uq_accounts_provider_account").on(
      table.provider,
      table.providerAccountId,
    ),
    index("idx_accounts_user_id").on(table.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
