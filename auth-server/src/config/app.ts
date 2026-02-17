// MODIFIED — added emailVerification config block
import { env } from "./env.js";

const accessTokenMs = env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS * 1000;
const refreshTokenMs = env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

const passwordResetTokenMs = 60 * 60 * 1000; // 1 hour
const emailVerificationMs = 24 * 60 * 60 * 1000; // 24 hours

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
    /**
     * How long an email verification token stays valid.
     * Used by EmailVerificationService.createToken().
     */
    emailVerification: {
      expiresInMs: emailVerificationMs,
      getExpiresAt: () => new Date(Date.now() + emailVerificationMs),
    },
  },
} as const;
