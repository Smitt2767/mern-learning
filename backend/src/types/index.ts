import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import type { AccountProvider } from "@mern/core";
import type * as schema from "../db/schema/index.js";

export type DbInstance = PgDatabase<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export interface OAuthUserProfile {
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export type OAuthProvider = Exclude<AccountProvider, "credentials">;
