import { env } from "@mern/env";

const accessTokenMs = env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS * 1000;
const refreshTokenMs = env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

const passwordResetTokenMs = 60 * 60 * 1000; // 1 hour
const emailVerificationTokenMs = 24 * 60 * 60 * 1000; // 24 hours

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
    emailVerificationToken: {
      getExpiresAt: () => new Date(Date.now() + emailVerificationTokenMs),
    },
  },
} as const;
