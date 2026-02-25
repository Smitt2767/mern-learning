import { env } from "@mern/env";
import type { CookieOptions } from "express";

export const cookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
};
