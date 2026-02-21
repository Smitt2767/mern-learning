import { Logger } from "@mern/logger";
import type { Logger as DrizzleLogger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

import { env } from "@mern/env";

class QueryLogger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    Logger.debug("Query:", query, params.length ? params : "");
  }
}

export class Database {
  private connectionString: string = `postgresql://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

  public db;
  public client;

  constructor() {
    this.client = this.createClient();
    this.db = drizzle(this.client, {
      schema,
      logger: env.NODE_ENV === "development" ? new QueryLogger() : false,
      casing: "snake_case",
    });
  }

  private createClient() {
    return postgres(this.connectionString, {
      max: env.NODE_ENV === "production" ? 20 : 5,
      onnotice: () => {},
      ssl: {
        rejectUnauthorized: env.NODE_ENV === "production",
      },
    });
  }

  public async connect() {
    try {
      await this.client`SELECT 1`;
      Logger.success("Database connected successfully");
    } catch (error) {
      Logger.error("Database connection failed:", error);
      process.exit(1);
    }
  }
}

export * from "./schema/index.js";
export * from "./types/index.js";
export { seedRbac } from "./seeds/rbac.js";
