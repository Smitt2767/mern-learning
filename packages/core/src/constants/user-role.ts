export const USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_ROLES = Object.values(USER_ROLE) as [UserRole, ...UserRole[]];
