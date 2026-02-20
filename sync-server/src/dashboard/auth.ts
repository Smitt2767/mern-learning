import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = "dashboard_token";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardTokenPayload {
  sub: string; // username
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: env.DASHBOARD_JWT_EXPIRY_SECONDS * 1000,
    secure: env.NODE_ENV === "production",
  };
}

function signToken(username: string): string {
  return jwt.sign(
    { sub: username } satisfies DashboardTokenPayload,
    env.DASHBOARD_JWT_SECRET,
    { expiresIn: env.DASHBOARD_JWT_EXPIRY_SECONDS },
  );
}

function verifyToken(token: string): DashboardTokenPayload | null {
  try {
    const payload = jwt.verify(token, env.DASHBOARD_JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return { sub: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}

function renderLoginPage(error?: string): string {
  const errorHtml =
    error !== undefined
      ? `<p class="error">${error}</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
    .card { background: #fff; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,.1); width: 100%; max-width: 360px; }
    h1 { font-size: 1.25rem; margin-bottom: 1.5rem; color: #111; }
    label { display: block; font-size: .875rem; color: #555; margin-bottom: .375rem; }
    input { width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; margin-bottom: 1rem; outline: none; }
    input:focus { border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,.15); }
    button { width: 100%; padding: .625rem; background: #1a56db; color: #fff; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1e429f; }
    .error { color: #dc2626; font-size: .875rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Queue Dashboard</h1>
    ${errorHtml}
    <form method="POST" action="/auth/login">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" required autocomplete="username" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required autocomplete="current-password" />
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Guards all dashboard routes. Checks for a valid `dashboard_token` cookie.
 * Redirects to /auth/login on failure, calls next() on success.
 */
export function requireDashboardAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = (req.cookies as Record<string, string | undefined>)[
    COOKIE_NAME
  ];

  if (!token) {
    res.redirect("/auth/login");
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.redirect("/auth/login");
    return;
  }

  next();
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/** GET /auth/login — renders the login form. */
export function getLoginPage(_req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(renderLoginPage());
}

/** POST /auth/login — validates credentials, sets cookie on success. */
export async function postLogin(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const username = typeof body["username"] === "string" ? body["username"] : "";
  const password = typeof body["password"] === "string" ? body["password"] : "";

  const usernameMatch = username === env.DASHBOARD_USERNAME;
  // Always run bcrypt.compare to prevent timing attacks, even on username mismatch.
  const passwordMatch = await bcrypt.compare(
    password,
    env.DASHBOARD_PASSWORD_HASH,
  );

  if (!usernameMatch || !passwordMatch) {
    res.setHeader("Content-Type", "text/html");
    res.status(401).send(renderLoginPage("Invalid username or password."));
    return;
  }

  const token = signToken(username);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.redirect(303, "/queues");
}

/** POST /auth/logout — clears the session cookie. */
export function postLogout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.redirect(303, "/auth/login");
}
