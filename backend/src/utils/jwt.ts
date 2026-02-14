import jwt from "jsonwebtoken";

import { authConfig } from "../config/auth.js";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export class Jwt {
  private constructor() {}

  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: authConfig.accessToken.expiresIn,
    });
  }

  static signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: authConfig.refreshToken.expiresIn,
    });
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  }

  static getRefreshTokenExpiresAt(): Date {
    return authConfig.refreshToken.getExpiresAt();
  }
}
