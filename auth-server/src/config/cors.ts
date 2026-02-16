import cors, { type CorsOptions } from "cors";

import { env } from "./env.js";

const corsOptions: CorsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  maxAge: 86400, // 24 hours in seconds
};

export const corsConfig = () => {
  return cors(corsOptions);
};
