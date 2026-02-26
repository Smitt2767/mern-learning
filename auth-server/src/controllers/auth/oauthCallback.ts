import {
  ACCOUNT_PROVIDER,
  JOB_NAME,
  USER_STATUS,
  oauthProviderParamSchema,
} from "@mern/core";
import { QueueManager } from "@mern/queue";
import type { Request, Response } from "express";
import crypto from "node:crypto";

import { env } from "@mern/env";
import { AppError, Cookie, Jwt } from "@mern/server";
import { appConfig } from "../../config/app.js";
import { db } from "../../config/db.js";
import { AccountService } from "../../services/account.js";
import { InvitationService } from "../../services/invitation.js";
import { RoleService } from "../../services/role.js";
import { SessionService } from "../../services/session.js";
import { UserService } from "../../services/user.js";
import { getOAuthProvider } from "../../utils/oauth/index.js";

export async function oauthCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  // ── 1. Provider-level errors (user denied access, etc.) ──────────────────
  if (error) {
    return redirectWithError(res, "oauth_denied");
  }

  // ── 2. Validate required params ───────────────────────────────────────────
  if (!code || !state) {
    return redirectWithError(res, "missing_params");
  }

  try {
    const { provider: providerName } = oauthProviderParamSchema.parse(
      req.params,
    );

    // ── 3. Resolve provider — throws 400 for unknown slugs ────────────────
    const provider = getOAuthProvider(providerName);

    // ── 4. Validate & consume CSRF state (one-time use) ────────────────────
    await provider.validateAndConsumeState(state);

    // ── 5. Exchange code → provider tokens → normalized user profile ───────
    const profile = await provider.exchangeCodeForProfile(code);

    const providerEnum =
      provider.providerName === "google"
        ? ACCOUNT_PROVIDER.GOOGLE
        : ACCOUNT_PROVIDER.GITHUB;

    const defaultRoleId = await RoleService.findDefaultUserRoleId();

    // ── 6. Find or create user (wrapped in transaction) ────────────────────
    const { user, isNewUser } = await db.transaction(async (tx) => {
      const existingAccount = await AccountService.findByProviderAndAccountId(
        providerEnum,
        profile.providerAccountId,
        tx,
      );

      if (existingAccount) {
        const user = await UserService.findById(existingAccount.userId);
        if (!user) throw AppError.internal("Orphaned OAuth account");

        if (user.status === USER_STATUS.SUSPENDED) {
          throw AppError.forbidden("Your account has been suspended");
        }

        if (user.status === USER_STATUS.INACTIVE) {
          await UserService.updateStatus(user.id, USER_STATUS.ACTIVE, tx);
        }

        if (
          profile.profileImage &&
          user.profileImage !== profile.profileImage
        ) {
          await UserService.updateProfileImage(
            user.id,
            profile.profileImage,
            tx,
          );
        }

        return { user, isNewUser: false };
      }

      const existingUser = await UserService.findByEmail(profile.email, tx);
      if (existingUser) {
        throw AppError.badRequest("email_already_registered");
      }

      const newUser = await UserService.create(
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profileImage: profile.profileImage,
          emailVerifiedAt: new Date(),
          roleId: defaultRoleId,
        },
        tx,
      );

      await AccountService.create(
        {
          userId: newUser.id,
          provider: providerEnum,
          providerAccountId: profile.providerAccountId,
        },
        tx,
      );

      return { user: newUser, isNewUser: true };
    });

    // ── 7. Create session & sign tokens ───────────────────────────────────
    const sessionId = crypto.randomUUID();
    const accessToken = Jwt.signAccessToken({ userId: user.id, sessionId });
    const refreshToken = Jwt.signRefreshToken({ userId: user.id, sessionId });

    await SessionService.create({
      id: sessionId,
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
      expiresAt: Jwt.getRefreshTokenExpiresAt(),
    });

    // ── 8. Set HttpOnly cookies ────────────────────────────────────────────
    Cookie.set(res, "access_token", accessToken, {
      maxAge: appConfig.auth.accessToken.maxAge,
    });

    Cookie.set(res, "refresh_token", refreshToken, {
      maxAge: appConfig.auth.refreshToken.maxAge,
    });

    // ── 9. Enqueue welcome email for brand-new users ───────────────────────
    if (isNewUser) {
      void QueueManager.add(
        JOB_NAME.SEND_WELCOME_EMAIL,
        {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
        },
        { priority: 10 },
      );
    }

    // ── 10. Auto-accept any pending org invitations — fire-and-forget ─────
    // OAuth emails are pre-verified by the provider, so it's safe to
    // auto-accept immediately for both new and returning users.
    void InvitationService.autoAcceptPendingByEmail(user.email, user.id);

    // ── 11. Redirect to frontend ──────────────────────────────────────────
    res.redirect(`${env.FRONTEND_URL}/auth/callback?success=true`);
  } catch (err: unknown) {
    if (err instanceof AppError) {
      if (err.statusCode === 403)
        return redirectWithError(res, "account_suspended");
      if (err.statusCode === 400) return redirectWithError(res, "bad_request");
    }
    return redirectWithError(res, "server_error");
  }
}

function redirectWithError(res: Response, reason: string): void {
  res.redirect(`${env.FRONTEND_URL}/auth/callback?error=${reason}`);
}
