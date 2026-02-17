import { Database } from "@mern/database";

/**
 * Database connection for mail-server.
 *
 * mail-server needs Postgres only to write job_logs rows.
 * It uses the same @mern/database package as auth-server so both servers
 * share identical schema types and the same query builder.
 *
 * We connect to the same Postgres instance — there is only one database.
 * mail-server is just a second process reading/writing the same tables.
 */
export const database = new Database();

/** The Drizzle ORM instance — import this wherever you need to query. */
export const db: Database["db"] = database.db;
