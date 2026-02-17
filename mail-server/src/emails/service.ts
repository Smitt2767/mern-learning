import { Logger } from "@mern/logger";
import type { EmailJobRegistry } from "@mern/queue";
import { render } from "@react-email/render";
import React from "react";
import { env } from "../config/env.js";
import { FROM_ADDRESS, resend } from "../config/resend.js";
import { PasswordResetEmailTemplate } from "./templates/password-reset.js";
import { VerifyEmailTemplate } from "./templates/verify-email.js";
import { WelcomeEmailTemplate } from "./templates/welcome.js";

/**
 * EmailService
 *
 * Static methods only, private constructor — consistent with the OOP
 * pattern used throughout the monorepo (UserService, SessionService, etc.).
 *
 * Each method:
 *   1. Builds the URL the email template needs
 *   2. Renders the React Email component to HTML + plain-text simultaneously
 *   3. Calls Resend
 *   4. Throws on failure so BullMQ triggers its retry logic
 *
 * Method names map 1:1 to EmailJobRegistry keys — easy to find which
 * handler calls which method.
 */
export class EmailService {
  private constructor() {}

  // ─── send-verification-email ───────────────────────────────────────────────

  static async sendVerificationEmail(
    data: EmailJobRegistry["send-verification-email"],
  ): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${data.verificationToken}`;

    const element = React.createElement(VerifyEmailTemplate, {
      firstName: data.firstName,
      verificationUrl,
    });

    // render() returns HTML; with plainText: true it strips tags for the fallback
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.email,
      subject: VerifyEmailTemplate.subject,
      html,
      text,
    });

    if (error) {
      // Throwing causes BullMQ to retry according to the queue's backoff config
      Logger.error("[EmailService] send-verification-email failed:", error);
      throw new Error(`Resend error: ${error.message}`);
    }

    Logger.success(`[EmailService] Verification email sent → ${data.email}`);
  }

  // ─── send-welcome-email ────────────────────────────────────────────────────

  static async sendWelcomeEmail(
    data: EmailJobRegistry["send-welcome-email"],
  ): Promise<void> {
    const loginUrl = `${env.FRONTEND_URL}/login`;

    const element = React.createElement(WelcomeEmailTemplate, {
      firstName: data.firstName,
      loginUrl,
    });

    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.email,
      subject: WelcomeEmailTemplate.subject(data.firstName),
      html,
      text,
    });

    if (error) {
      Logger.error("[EmailService] send-welcome-email failed:", error);
      throw new Error(`Resend error: ${error.message}`);
    }

    Logger.success(`[EmailService] Welcome email sent → ${data.email}`);
  }

  // ─── send-password-reset-email ─────────────────────────────────────────────

  static async sendPasswordResetEmail(
    data: EmailJobRegistry["send-password-reset-email"],
  ): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${data.resetToken}`;

    const element = React.createElement(PasswordResetEmailTemplate, {
      firstName: data.firstName,
      resetUrl,
    });

    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.email,
      subject: PasswordResetEmailTemplate.subject,
      html,
      text,
    });

    if (error) {
      Logger.error("[EmailService] send-password-reset-email failed:", error);
      throw new Error(`Resend error: ${error.message}`);
    }

    Logger.success(`[EmailService] Password reset email sent → ${data.email}`);
  }
}
