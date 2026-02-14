import { env } from "./env.js";

const accessTokenMs = env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const refreshTokenMs = env.JWT_REFRESH_TOKEN_EXPIRY_MINUTES * 60 * 1000;

export const appConfig = {
  auth: {
    accessToken: {
      maxAge: accessTokenMs,
      expiresIn: `${env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES}m`,
    },
    refreshToken: {
      maxAge: refreshTokenMs,
      expiresIn: `${env.JWT_REFRESH_TOKEN_EXPIRY_MINUTES}m`,
      getExpiresAt: () => new Date(Date.now() + refreshTokenMs),
    },
  },
} as const;
