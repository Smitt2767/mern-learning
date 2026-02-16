import { USER_STATUS, type UserRole } from "@mern/core";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { AuthCallbacks } from "../types.js";
import { AppError } from "../utils/app-error.js";
import { Cookie } from "../utils/cookie.js";
import { Jwt } from "../utils/jwt.js";

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return Cookie.get(req, "access_token");
}

function verifyToken(token: string) {
  try {
    return Jwt.verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.tokenExpired();
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw AppError.invalidToken();
    }

    throw AppError.unauthorized();
  }
}

export function createAuthMiddleware(callbacks: AuthCallbacks) {
  async function clearSession(res: Response, sessionId: string): Promise<void> {
    Cookie.delete(res, "access_token");
    Cookie.delete(res, "refresh_token");
    await callbacks.deleteSession(sessionId);
  }

  async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized();
    }

    const payload = verifyToken(token);

    const session = await callbacks.findSession(
      payload.userId,
      payload.sessionId,
    );
    if (!session || session.expiresAt < new Date()) {
      throw AppError.sessionExpired();
    }

    const user = await callbacks.findUser(payload.userId);
    if (!user) {
      throw AppError.unauthorized();
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      await clearSession(res, session.id);
      throw AppError.forbidden("Your account has been suspended");
    }

    if (user.status === USER_STATUS.INACTIVE) {
      await clearSession(res, session.id);
      throw AppError.forbidden(
        "Your account is deactivated. Please log in again to reactivate.",
      );
    }

    req.user = user;
    req.sessionId = session.id;
    next();
  }

  return authenticate;
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw AppError.forbidden("Access denied");
    }
    next();
  };
}
