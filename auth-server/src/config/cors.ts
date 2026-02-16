import type { CorsOptions } from "@mern/server";

import { env } from "./env.js";

export const corsOptions: CorsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  maxAge: 86400, // 24 hours in seconds
};
