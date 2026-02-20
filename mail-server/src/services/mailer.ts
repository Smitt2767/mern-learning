import * as React from "react"
import { Resend } from "resend"

import { env } from "../config/env.js"
import { EmailVerificationEmail } from "../emails/email-verification.js"
import { ResetPasswordEmail } from "../emails/reset-password.js"
import { WelcomeEmail } from "../emails/welcome.js"

export class Mailer {
  private static instance: Mailer
  private readonly resend: Resend
  private readonly from: string

  private constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
    this.from = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`
  }

  static getInstance(): Mailer {
    if (!Mailer.instance) {
      Mailer.instance = new Mailer()
    }
    return Mailer.instance
  }

  async sendWelcomeEmail(data: { email: string; firstName: string }) {
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: `Welcome to MERN, ${data.firstName}!`,
      react: React.createElement(WelcomeEmail, { firstName: data.firstName }),
    })
  }

  async sendEmailVerification(data: {
    email: string
    token: string
    expiresAt: string
  }) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${data.token}`
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: "Verify your email address",
      react: React.createElement(EmailVerificationEmail, {
        email: data.email,
        verificationUrl,
        expiresAt: data.expiresAt,
      }),
    })
  }

  async sendPasswordReset(data: {
    email: string
    token: string
    expiresAt: string
  }) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${data.token}`
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: "Reset your password",
      react: React.createElement(ResetPasswordEmail, {
        email: data.email,
        resetUrl,
        expiresAt: data.expiresAt,
      }),
    })
  }
}

export const mailer = Mailer.getInstance()
