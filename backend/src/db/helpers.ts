import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = uuid().defaultRandom().primaryKey();

export const createdAt = timestamp({ withTimezone: true, mode: "date" })
  .defaultNow()
  .notNull();

export const updatedAt = timestamp({ withTimezone: true, mode: "date" })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());
