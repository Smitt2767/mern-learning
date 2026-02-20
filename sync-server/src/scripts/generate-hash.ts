/**
 * generate-hash.ts
 *
 * One-time utility to generate a bcrypt hash for the dashboard password.
 * The output value goes in your .env as DASHBOARD_PASSWORD_HASH.
 *
 * Usage:
 *   DASHBOARD_PLAIN_PASSWORD=yourpassword pnpm --filter sync-server generate-hash
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const plainPassword = process.env["DASHBOARD_PLAIN_PASSWORD"];

if (!plainPassword) {
  console.error(
    "Error: DASHBOARD_PLAIN_PASSWORD env var is required.\n" +
      "Usage: DASHBOARD_PLAIN_PASSWORD=yourpassword pnpm --filter sync-server generate-hash",
  );
  process.exit(1);
}

const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

console.log("\nBcrypt hash generated successfully.");
console.log("Add this to your .env file:\n");
console.log(`DASHBOARD_PASSWORD_HASH=${hash}\n`);
