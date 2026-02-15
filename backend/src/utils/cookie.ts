import type { CookieOptions, Request, Response } from "express";

import { env } from "../config/env.js";

const IS_PRODUCTION = env.NODE_ENV === "production";

const DEFAULT_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
};

/**
 * Utility class for handling cookies in Express responses and requests.
 */
export class Cookie {
  private constructor() {}

  /**
   * Set a cookie on the response with specified name and value.
   * Merges provided options with sensible defaults (`httpOnly`, `secure` in prod, `sameSite=lax`, `path=/`).
   *
   * @param res - Express response object
   * @param name - Name of the cookie
   * @param value - Value of the cookie
   * @param options - Optional cookie options to override defaults
   *
   * @example
   * Cookie.set(res, "sessionId", "my-secret-session", { maxAge: 3600000 });
   */
  static set(
    res: Response,
    name: string,
    value: string,
    options?: CookieOptions,
  ): void {
    res.cookie(name, value, { ...DEFAULT_OPTIONS, ...options });
  }

  /**
   * Retrieve a cookie value by name from the request.
   *
   * @param req - Express request object
   * @param name - Name of the cookie to get
   * @returns The value of the cookie, or undefined if not present
   *
   * @example
   * const username = Cookie.get(req, "username");
   */
  static get(req: Request, name: string): string | undefined {
    return (req.cookies as Record<string, string | undefined>)[name];
  }

  /**
   * Delete a cookie by name from the response.
   * Uses the default options and allows further overrides.
   *
   * @param res - Express response object
   * @param name - Name of the cookie to delete
   * @param options - Optional cookie options to override defaults
   *
   * @example
   * Cookie.delete(res, "sessionId");
   */
  static delete(res: Response, name: string, options?: CookieOptions): void {
    res.clearCookie(name, { ...DEFAULT_OPTIONS, ...options });
  }
}
