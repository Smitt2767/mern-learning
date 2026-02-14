import type { AccountProvider } from "../constants/account-provider.js";
import type { UserRole } from "../constants/user-role.js";
import type { UserStatus } from "../constants/user-status.js";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  provider: AccountProvider;
  providerAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
}
