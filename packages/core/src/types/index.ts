import type { UserRole, UserStatus } from "../constants/index.js";

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
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
