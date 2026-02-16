import cors, { type CorsOptions } from "cors";

import { env } from "./env.js";

const corsOptions: CorsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  exposedHeaders: ["Content-Length", "X-Known-Header", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  maxAge: 86400, // 24 hours in seconds
};

export const corsConfig = () => {
  return cors(corsOptions);
};
