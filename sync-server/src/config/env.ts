import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),

    // Database
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    // Redis
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // Dashboard
    DASHBOARD_PORT: z.coerce.number().default(5001),
    DASHBOARD_USERNAME: z.string().min(1),
    DASHBOARD_PASSWORD_HASH: z.string().min(1),
    DASHBOARD_JWT_SECRET: z.string().min(32),
    DASHBOARD_JWT_EXPIRY_SECONDS: z.coerce.number().default(3600),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
