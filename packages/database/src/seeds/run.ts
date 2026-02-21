/**
 * run.ts — CLI entrypoint for manual RBAC seed execution.
 *
 * Usage:
 *   pnpm --filter @mern/database seed
 *
 * This uses the same Database class and env config as every other service,
 * so it connects using the DB credentials in packages/database/.env
 *
 * Safe to run any number of times — the seed is fully idempotent.
 */

import { Logger } from "@mern/logger";
import { Database } from "../index.js";
import { seedRbac } from "./rbac.js";

async function run(): Promise<void> {
  const database = new Database();

  try {
    await database.connect();
    await seedRbac(database.db);
  } catch (err) {
    Logger.error("[seed] Seed failed:", err);
    process.exit(1);
  } finally {
    await database.client.end();
    Logger.info("[seed] Database connection closed.");
  }
}

await run();
