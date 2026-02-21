import type { CookieOptions } from "express";
import { env } from "@mern/env";

export const cookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
};
