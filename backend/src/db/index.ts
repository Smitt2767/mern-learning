import { Logger } from "@mern/logger";
import type { Logger as DrizzleLogger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

class QueryLogger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    Logger.debug("Query:", query, params.length ? params : "");
  }
}

const connectionString = `postgresql://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

const client = postgres(connectionString, {
  max: env.NODE_ENV === "production" ? 20 : 5,
  onnotice: () => {},
  ssl: {
    rejectUnauthorized: env.NODE_ENV === "production",
  },
});

export const db = drizzle(client, {
  schema,
  logger: env.NODE_ENV === "development" ? new QueryLogger() : false,
});

export async function connectDB() {
  try {
    await client`SELECT 1`;
    Logger.success("Database connected successfully");
  } catch (error) {
    Logger.error("Database connection failed:", error);
    process.exit(1);
  }
}
