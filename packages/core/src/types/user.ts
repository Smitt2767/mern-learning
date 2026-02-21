import type { UserStatus } from "../constants/user-status.js";
import type { RoleWithPermissions } from "./role.js";

// ─── User ─────────────────────────────────────────────────────────────────────
// Mirrors the `users` DB row exactly.
// `roleId` is nullable — null means no role assigned (e.g. role was deleted).

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  profileImage: string | null;
  roleId: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SessionUser ──────────────────────────────────────────────────────────────
// The shape attached to `req.user` after authentication.
// `password` is stripped. `role` is the fully resolved RoleWithPermissions
// object loaded from DB (and cached in Redis) at auth time.

export type SessionUser = Omit<User, "password"> & {
  role: RoleWithPermissions | null;
};
