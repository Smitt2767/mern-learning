import { env } from "./env.js";

// Convert env values (minutes/days) to milliseconds for cookie maxAge and session expiry
const accessTokenMs = env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const refreshTokenMs = env.JWT_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const authConfig = {
  accessToken: {
    /** Cookie maxAge in milliseconds */
    maxAge: accessTokenMs,
    /** JWT expiresIn string (e.g. "15m") used by jsonwebtoken */
    expiresIn: `${env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES}m`,
  },
  refreshToken: {
    /** Cookie maxAge in milliseconds */
    maxAge: refreshTokenMs,
    /** JWT expiresIn string (e.g. "7d") used by jsonwebtoken */
    expiresIn: `${env.JWT_REFRESH_TOKEN_EXPIRY_DAYS}d`,
    /** Returns the absolute expiry date from now — useful for DB session records */
    getExpiresAt: () => new Date(Date.now() + refreshTokenMs),
  },
} as const;
