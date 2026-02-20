import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email(),
    EMAIL_FROM_NAME: z.string().min(1).default("MERN App"),
    FRONTEND_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
