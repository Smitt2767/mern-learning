import { Resend } from "resend";
import { env } from "./env.js";

/**
 * Resend client singleton.
 * Instantiated once at module load — safe to import from any file.
 */
export const resend = new Resend(env.RESEND_API_KEY);

/**
 * The RFC 5322 "From" header value, e.g.: "Your App <noreply@yourdomain.com>"
 * Resend requires this exact format for the `from` field.
 */
export const FROM_ADDRESS =
  `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>` as const;
