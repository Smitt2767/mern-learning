// ─── Registry ─────────────────────────────────────────────────────────────────

import type { OAuthProvider, OAuthUserProfile } from "../../types/index.js";
import { AppError } from "../app-error.js";
import type { BaseOAuthProvider } from "./base.js";
import { gitHubOAuthProvider } from "./github.js";
import { googleOAuthProvider } from "./google.js";

const registry = {
  google: googleOAuthProvider,
  github: gitHubOAuthProvider,
} as const satisfies Record<OAuthProvider, BaseOAuthProvider>;

export function getOAuthProvider(provider: string): BaseOAuthProvider {
  if (!(provider in registry)) {
    throw AppError.badRequest(`Unsupported OAuth provider: ${provider}`);
  }
  return registry[provider as OAuthProvider];
}

export { BaseOAuthProvider } from "./base.js";
export { gitHubOAuthProvider } from "./github.js";
export { googleOAuthProvider } from "./google.js";
export type { OAuthProvider, OAuthUserProfile };
