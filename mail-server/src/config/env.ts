import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

/**
 * Type-safe environment variables for mail-server.
 * Validated at startup — missing or malformed vars throw immediately
 * instead of causing mysterious runtime errors later.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SERVER_PORT: z.coerce.number().default(5001),
    // Redis — must be the SAME instance auth-server writes to
    REDIS_HOST: z.string().min(1).default("127.0.0.1"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // Postgres — same database as auth-server (for job_logs)
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    // Resend
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.email(),
    RESEND_FROM_NAME: z.string().default("App"),

    // Used to build links inside email templates
    FRONTEND_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
