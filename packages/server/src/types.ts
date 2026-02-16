import type { CorsOptions } from "cors";
import type { CookieOptions } from "express";

interface JwtTokenOptions {
  secret?: string;
  expiresInSec?: number;
}

export interface JwtConfig {
  accessToken?: JwtTokenOptions;
  refreshToken?: JwtTokenOptions;
}

export interface ServerConfig {
  port?: number;
  corsOptions?: CorsOptions;
  trustProxy?: number | string | boolean;
  jwt?: JwtConfig;
  cookieOptions?: CookieOptions;
  errorStackTrace?: boolean;
}

export interface AuthCallbacks {
  findSession: (
    userId: string,
    sessionId: string,
  ) => Promise<{ id: string; expiresAt: Date } | null | undefined>;
  findUser: (
    userId: string,
  ) => Promise<Express.Request["user"] | null | undefined>;
  deleteSession: (sessionId: string) => Promise<void>;
}
