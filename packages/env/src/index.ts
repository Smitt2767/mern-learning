import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    // ── Node ──────────────────────────────────────────────────────────────
    NODE_ENV: z.enum(["development", "production", "test"]),

    // ── Auth Server ───────────────────────────────────────────────────────
    AUTH_SERVER_URL: z.url().optional(),
    AUTH_SERVER_PORT: z.coerce.number().default(5000),

    // ── Main Server ───────────────────────────────────────────────────────
    MAIN_SERVER_URL: z.url().optional(),
    MAIN_SERVER_PORT: z.coerce.number().default(5002),

    // ── Admin Server ──────────────────────────────────────────────────────
    ADMIN_SERVER_URL: z.url().optional(),
    ADMIN_SERVER_PORT: z.coerce.number().default(5001),

    // ── Database ──────────────────────────────────────────────────────────
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    // ── Redis ─────────────────────────────────────────────────────────────
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // ── Frontend ──────────────────────────────────────────────────────────
    FRONTEND_URL: z.url().optional(),

    // ── JWT ───────────────────────────────────────────────────────────────
    JWT_ACCESS_SECRET: z.string().min(32).optional(),
    JWT_REFRESH_SECRET: z.string().min(32).optional(),
    JWT_ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(604800),
    JWT_REFRESH_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(2592000),

    // ── OAuth (auth-server only) ──────────────────────────────────────────
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // ── Boot scripts ──────────────────────────────────────────────────────
    EXECUTE_BOOT_SCRIPTS: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),

    // ── Mail (mail-server only) ───────────────────────────────────────────
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    EMAIL_FROM_NAME: z.string().default("MERN App"),

    // ── BullMQ Dashboard (sync-server only) ───────────────────────────────
    DASHBOARD_PORT: z.coerce.number().default(5005),
    DASHBOARD_USERNAME: z.string().optional(),
    DASHBOARD_PASSWORD_HASH: z.string().optional(),
    DASHBOARD_JWT_SECRET: z.string().optional(),
    DASHBOARD_JWT_EXPIRY_SECONDS: z.coerce.number().default(3600),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
