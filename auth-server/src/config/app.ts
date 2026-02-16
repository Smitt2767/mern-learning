import { env } from "./env.js";

const accessTokenMs = env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS * 1000;
const refreshTokenMs = env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

const passwordResetTokenMs = 60 * 60 * 1000; // 1 hour

export const appConfig = {
  auth: {
    accessToken: {
      maxAge: accessTokenMs,
    },
    refreshToken: {
      maxAge: refreshTokenMs,
    },
    passwordResetToken: {
      getExpiresAt: () => new Date(Date.now() + passwordResetTokenMs),
    },
  },
} as const;
