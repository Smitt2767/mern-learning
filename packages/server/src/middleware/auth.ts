import {
  ACTION_LEVEL,
  PERMISSION_SCOPE,
  PERMISSION_SCOPE_MAP,
  SYSTEM_ROLE,
  USER_STATUS,
  type PermissionAction,
  type PermissionKey,
} from "@mern/core";
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

/**
 * authorize
 *
 * Checks the calling user's GLOBAL role has at least `minAction` on `permissionKey`.
 *
 * Guards:
 *   - Only accepts global-scoped permission keys. Passing an org-scoped key
 *     (ORG_MANAGEMENT, MEMBER_MANAGEMENT, INVITATION_MANAGEMENT) throws immediately
 *     to prevent accidental misuse — use authorizeOrg() for those.
 *   - super_admin bypasses all permission checks.
 *
 * Must be used after authenticate().
 */
export function authorize(
  permissionKey: PermissionKey,
  minAction: PermissionAction,
) {
  // Fail fast at route registration time if a dev accidentally passes an
  // org-scoped permission key to the global authorize() middleware.
  if (PERMISSION_SCOPE_MAP[permissionKey] !== PERMISSION_SCOPE.GLOBAL) {
    throw new Error(
      `authorize() called with org-scoped permission "${permissionKey}". ` +
        `Use authorizeOrg() for organization-scoped permissions.`,
    );
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role) {
      throw AppError.forbidden("No role assigned");
    }

    // super_admin bypasses all permission checks
    if (role.name === SYSTEM_ROLE.SUPER_ADMIN) {
      return next();
    }

    const userAction: PermissionAction =
      role.permissions[permissionKey] ?? "none";

    if (ACTION_LEVEL[userAction] < ACTION_LEVEL[minAction]) {
      throw AppError.forbidden("Insufficient permissions");
    }

    next();
  };
}
