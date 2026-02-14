import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    SERVER_PORT: z.coerce.number().default(5000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
