import crypto from "node:crypto";
import { Cache } from "@mern/cache";
import { CacheKeys } from "../../cache/keys.js";
import { env } from "../../config/env.js";
import type { OAuthProvider, OAuthUserProfile } from "../../types/index.js";
import { AppError } from "../app-error.js";

/**
 * Abstract base for all OAuth providers.
 *
 * Concrete subclasses must declare provider-specific config via abstract
 * properties and implement `exchangeCodeForProfile` for their own token
 * exchange + normalization logic.
 *
 * Shared behavior provided here:
 *  - CSRF state generation & one-time-use consumption (Redis)
 *  - Authorization URL construction (with an extensible params hook)
 *  - Callback URL derivation
 *
 * To add a new provider:
 *  1. Create `<provider>.ts` extending `BaseOAuthProvider`
 *  2. Declare all abstract properties
 *  3. Implement `exchangeCodeForProfile`
 *  4. Register the singleton in `index.ts`
 */
export abstract class BaseOAuthProvider {
  // ─── Abstract contract ────────────────────────────────────────────────────

  /** The provider slug used in routes and Redis keys. */
  abstract readonly providerName: OAuthProvider;

  /** Provider authorization endpoint. */
  abstract readonly authUrl: string;

  /** Provider token exchange endpoint. */
  abstract readonly tokenUrl: string;

  /** OAuth client ID (read from env). */
  abstract readonly clientId: string;

  /** OAuth client secret (read from env). */
  abstract readonly clientSecret: string;

  /** Space-separated list of requested OAuth scopes. */
  abstract readonly scope: string;

  /**
   * Exchange an authorization code for a normalized user profile.
   * Each provider handles its own token request + user info fetch.
   */
  abstract exchangeCodeForProfile(code: string): Promise<OAuthUserProfile>;

  // ─── Hook ─────────────────────────────────────────────────────────────────

  /**
   * Override to inject extra query params into the authorization URL.
   *
   * @example Google overrides this to add `access_type=offline` + `prompt=select_account`
   */
  protected getExtraAuthParams(): Record<string, string> {
    return {};
  }

  // ─── Shared concrete logic ────────────────────────────────────────────────

  /**
   * Generate a cryptographically random CSRF state token.
   * Stored in Redis under `oauth:state:<token>` with a 15-minute TTL.
   * The value stored is the provider name for cross-validation on callback.
   */
  async generateState(): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");
    await Cache.set(this.stateKey(state), this.providerName, "fifteenMinutes");
    return state;
  }

  /**
   * Validate and immediately consume the state token (one-time use).
   * Deletes the Redis key before checking — prevents replay even on errors.
   *
   * @throws AppError.badRequest if state is missing, expired, or provider-mismatched
   */
  async validateAndConsumeState(state: string): Promise<void> {
    const key = this.stateKey(state);
    const storedProvider = await Cache.get(key);

    // Delete unconditionally — one-time use regardless of outcome
    await Cache.invalidate(key);

    if (!storedProvider) {
      throw AppError.badRequest("Invalid or expired OAuth state");
    }

    if (storedProvider !== this.providerName) {
      throw AppError.badRequest("OAuth state provider mismatch");
    }
  }

  /**
   * Build the full provider authorization URL the browser is redirected to.
   * Merges base params with provider-specific extras from `getExtraAuthParams()`.
   */
  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.getCallbackUrl(),
      scope: this.scope,
      state,
      ...this.getExtraAuthParams(),
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * The redirect URI registered with the OAuth provider.
   * Points to the backend callback endpoint for this provider.
   */
  getCallbackUrl(): string {
    const backendUrl = env.SERVER_URL;
    return `${backendUrl}/api/auth/callback/${this.providerName}`;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private stateKey(state: string): string {
    return CacheKeys.oauth.state(state);
  }
}
