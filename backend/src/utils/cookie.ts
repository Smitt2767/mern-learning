import type { CookieOptions, Request, Response } from "express";

import { env } from "../config/env.js";

const IS_PRODUCTION = env.NODE_ENV === "production";

const DEFAULT_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
};

export class Cookie {
  private constructor() {}

  static set(
    res: Response,
    name: string,
    value: string,
    options?: CookieOptions,
  ): void {
    res.cookie(name, value, { ...DEFAULT_OPTIONS, ...options });
  }

  static get(req: Request, name: string): string | undefined {
    return (req.cookies as Record<string, string | undefined>)[name];
  }

  static delete(res: Response, name: string, options?: CookieOptions): void {
    res.clearCookie(name, { ...DEFAULT_OPTIONS, ...options });
  }
}
