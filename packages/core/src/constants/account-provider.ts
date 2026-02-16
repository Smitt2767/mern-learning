export const OAUTH_PROVIDER = {
  GITHUB: "github",
  GOOGLE: "google",
} as const;

export const ACCOUNT_PROVIDER = {
  CREDENTIALS: "credentials",
  ...OAUTH_PROVIDER,
} as const;

export type OAuthProvider =
  (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];

export type AccountProvider =
  (typeof ACCOUNT_PROVIDER)[keyof typeof ACCOUNT_PROVIDER];

export const OAUTH_PROVIDERS = Object.values(OAUTH_PROVIDER) as [
  OAuthProvider,
  ...OAuthProvider[],
];
export const ACCOUNT_PROVIDERS = Object.values(ACCOUNT_PROVIDER) as [
  AccountProvider,
  ...AccountProvider[],
];
