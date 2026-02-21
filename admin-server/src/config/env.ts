import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    SERVER_URL: z.url(),
    SERVER_PORT: z.coerce.number().default(5001),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string(),
    FRONTEND_URL: z.url(),

    // JWT — must match auth-server secrets exactly (admin-server only verifies, never signs)
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(10080),
    JWT_REFRESH_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(43200),

    EXECUTE_BOOT_SCRIPTS: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
