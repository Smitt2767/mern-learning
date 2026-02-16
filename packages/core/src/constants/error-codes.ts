export const ERROR_CODE = {
  // ── Auth ────────────────────────────────────────────────────────────────
  /** Invalid or missing authentication credentials */
  UNAUTHORIZED: "UNAUTHORIZED",
  /** Token signature is invalid or the token is malformed */
  INVALID_TOKEN: "INVALID_TOKEN",
  /** Token is well-formed but has passed its expiry time */
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  /** Session no longer exists or has expired server-side */
  SESSION_EXPIRED: "SESSION_EXPIRED",
  /** Authenticated but lacks the required role / permission */
  FORBIDDEN: "FORBIDDEN",

  // ── Resource ─────────────────────────────────────────────────────────────
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // ── Input ────────────────────────────────────────────────────────────────
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",

  // ── Rate limiting ────────────────────────────────────────────────────────
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // ── Server ───────────────────────────────────────────────────────────────
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
