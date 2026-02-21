// ─── Google API DTOs ──────────────────────────────────────────────────────────

import { env } from "@mern/env";
import type { OAuthUserProfile } from "../../types/index.js";
import { AppError } from "@mern/server";
import { BaseOAuthProvider } from "./base.js";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  picture: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

class GoogleOAuthProvider extends BaseOAuthProvider {
  readonly providerName = "google" as const;
  readonly authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  readonly tokenUrl = "https://oauth2.googleapis.com/token";
  readonly userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
  readonly clientId = env.GOOGLE_CLIENT_ID!;
  readonly clientSecret = env.GOOGLE_CLIENT_SECRET!;
  readonly scope = "openid email profile";

  /**
   * Requests offline access (refresh token) and always shows the account
   * picker so the user can switch accounts mid-session.
   */
  protected override getExtraAuthParams(): Record<string, string> {
    return {
      access_type: "offline",
      prompt: "select_account",
    };
  }

  async exchangeCodeForProfile(code: string): Promise<OAuthUserProfile> {
    // ── Step 1: Exchange code → access token ─────────────────────────────
    const tokenRes = await fetch(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.getCallbackUrl(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw AppError.unauthorized(
        "Failed to exchange Google authorization code",
      );
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    // ── Step 2: Fetch user profile ────────────────────────────────────────
    const userRes = await fetch(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw AppError.unauthorized("Failed to fetch Google user profile");
    }

    const profile = (await userRes.json()) as GoogleUserInfo;

    if (!profile.email_verified) {
      throw AppError.badRequest("Google account email is not verified");
    }

    // ── Step 3: Normalize to shared profile shape ────────────────────────
    return {
      providerAccountId: profile.sub,
      email: profile.email,
      firstName: profile.given_name ?? "Unknown",
      lastName: profile.family_name ?? "",
      profileImage: profile.picture ?? null,
    };
  }
}

/** Singleton — import and use directly, never instantiate outside this module. */
export const googleOAuthProvider = new GoogleOAuthProvider();
