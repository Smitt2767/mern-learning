import type { AccountProvider } from "@mern/core";

export interface OAuthUserProfile {
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export type OAuthProvider = Exclude<AccountProvider, "credentials">;
