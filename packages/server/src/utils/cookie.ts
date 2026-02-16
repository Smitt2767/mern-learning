import type { CookieOptions, Request, Response } from "express";

export class Cookie {
  private static options: CookieOptions | undefined;

  private constructor() {}

  static init(options?: CookieOptions): void {
    Cookie.options = options;
  }

  static set(
    res: Response,
    name: string,
    value: string,
    options?: CookieOptions,
  ): void {
    res.cookie(name, value, { ...Cookie.options, ...options });
  }

  static get(req: Request, name: string): string | undefined {
    return (req.cookies as Record<string, string | undefined>)[name];
  }

  static delete(res: Response, name: string, options?: CookieOptions): void {
    res.clearCookie(name, { ...Cookie.options, ...options });
  }
}
