// ─── GitHub API DTOs ──────────────────────────────────────────────────────────

import { env } from "../../config/env.js";
import type { OAuthUserProfile } from "../../types/index.js";
import { AppError } from "../app-error.js";
import { BaseOAuthProvider } from "./base.js";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

class GitHubOAuthProvider extends BaseOAuthProvider {
  readonly providerName = "github" as const;
  readonly authUrl = "https://github.com/login/oauth/authorize";
  readonly tokenUrl = "https://github.com/login/oauth/access_token";
  readonly userInfoUrl = "https://api.github.com/user";
  readonly clientId = env.GITHUB_CLIENT_ID;
  readonly clientSecret = env.GITHUB_CLIENT_SECRET;
  readonly scope = "read:user user:email";

  // GitHub needs no extra auth params — base default `{}` is sufficient.

  async exchangeCodeForProfile(code: string): Promise<OAuthUserProfile> {
    // ── Step 1: Exchange code → access token ─────────────────────────────
    const tokenRes = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // GitHub returns JSON only when explicitly requested
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.getCallbackUrl(),
      }),
    });

    if (!tokenRes.ok) {
      throw AppError.unauthorized(
        "Failed to exchange GitHub authorization code",
      );
    }

    const tokens = (await tokenRes.json()) as GitHubTokenResponse;

    // ── Step 2: Fetch user profile ────────────────────────────────────────
    const userRes = await fetch(this.userInfoUrl, {
      headers: this.githubHeaders(tokens.access_token),
    });

    if (!userRes.ok) {
      throw AppError.unauthorized("Failed to fetch GitHub user profile");
    }

    const profile = (await userRes.json()) as GitHubUserInfo;

    // ── Step 3: Resolve email ─────────────────────────────────────────────
    // GitHub users may hide their email on their public profile.
    // Fall back to the dedicated /user/emails endpoint.
    const email =
      profile.email ?? (await this.fetchPrimaryEmail(tokens.access_token));

    if (!email) {
      throw AppError.badRequest(
        "No verified email found on your GitHub account. " +
          "Please make your primary email public or verify an email.",
      );
    }

    // ── Step 4: Normalize to shared profile shape ────────────────────────
    // GitHub returns a single `name` field — split into first/last.
    const nameParts = (profile.name ?? profile.login ?? "").trim().split(" ");
    const firstName = nameParts[0] ?? profile.login ?? "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      providerAccountId: String(profile.id),
      email,
      firstName,
      lastName,
      profileImage: profile.avatar_url ?? null,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Fetch the user's primary verified email from the GitHub emails endpoint.
   * Called only when the public profile email is null.
   */
  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    const res = await fetch("https://api.github.com/user/emails", {
      headers: this.githubHeaders(accessToken),
    });

    if (!res.ok) return null;

    const emails = (await res.json()) as GitHubEmail[];
    return emails.find((e) => e.primary && e.verified)?.email ?? null;
  }

  /** Standard headers required by the GitHub REST API v3. */
  private githubHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
}

/** Singleton — import and use directly, never instantiate outside this module. */
export const gitHubOAuthProvider = new GitHubOAuthProvider();
