import jwt from "jsonwebtoken";

import z from "zod";
import type { JwtConfig } from "../types.js";

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

const tokenSchema = z.object({
  secret: z.string().min(1).optional(),
  expiresInSec: z.coerce.number().positive().optional(),
});

const schema = z
  .object({
    accessToken: tokenSchema.optional(),
    refreshToken: tokenSchema.optional(),
  })
  .transform((config) => ({
    accessSecret: config.accessToken?.secret ?? process.env.JWT_ACCESS_SECRET,
    refreshSecret:
      config.refreshToken?.secret ?? process.env.JWT_REFRESH_SECRET,
    accessExpiresInSec:
      config.accessToken?.expiresInSec ??
      Number(process.env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS),
    refreshExpiresInSec:
      config.refreshToken?.expiresInSec ??
      Number(process.env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS),
  }))
  .pipe(
    z.object({
      accessSecret: z.string().min(1, "Required accessToken secret."),
      refreshSecret: z.string().min(1, "Required refreshToken secret."),
      accessExpiresInSec: z
        .number({ message: "Required accessToken expiry (in sec)." })
        .positive("accessToken expiry must be positive."),
      refreshExpiresInSec: z
        .number({ message: "Required refreshToken expiry (in sec)." })
        .positive("refreshToken expiry must be positive."),
    }),
  );

export class Jwt {
  private static config: z.output<typeof schema>;

  private constructor() {}

  static init(config: JwtConfig = {}): void {
    Jwt.config = schema.parse(config);
  }

  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, Jwt.config.accessSecret, {
      expiresIn: Jwt.config.accessExpiresInSec,
    });
  }

  static signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, Jwt.config.refreshSecret, {
      expiresIn: Jwt.config.refreshExpiresInSec,
    });
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, Jwt.config.accessSecret) as AccessTokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, Jwt.config.refreshSecret) as RefreshTokenPayload;
  }

  static getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + Jwt.config.refreshExpiresInSec * 1000);
  }
}
