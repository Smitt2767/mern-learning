export const ACCOUNT_PROVIDER = {
  CREDENTIALS: "credentials",
  GITHUB: "github",
  GOOGLE: "google",
} as const;

export type AccountProvider = (typeof ACCOUNT_PROVIDER)[keyof typeof ACCOUNT_PROVIDER];

export const ACCOUNT_PROVIDERS = Object.values(ACCOUNT_PROVIDER) as [AccountProvider, ...AccountProvider[]];
