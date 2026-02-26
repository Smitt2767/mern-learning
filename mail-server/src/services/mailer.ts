import * as React from "react";
import { Resend } from "resend";

import { env } from "@mern/env";
import { EmailVerificationEmail } from "../emails/email-verification.js";
import { OrgInvitationEmail } from "../emails/org-invitation.js";
import { OrgMemberJoinedEmail } from "../emails/org-member-joined.js";
import { OrgRoleChangedEmail } from "../emails/org-role-changed.js";
import { ResetPasswordEmail } from "../emails/reset-password.js";
import { WelcomeEmail } from "../emails/welcome.js";

export class Mailer {
  private static instance: Mailer;
  private readonly resend: Resend;
  private readonly from: string;

  private constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.from = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`;
  }

  static getInstance(): Mailer {
    if (!Mailer.instance) {
      Mailer.instance = new Mailer();
    }
    return Mailer.instance;
  }

  async sendWelcomeEmail(data: { email: string; firstName: string }) {
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: `Welcome to MERN, ${data.firstName}!`,
      react: React.createElement(WelcomeEmail, { firstName: data.firstName }),
    });
  }

  async sendEmailVerification(data: {
    email: string;
    token: string;
    expiresAt: string;
  }) {
    const verificationUrl = `${env.AUTH_SERVER_URL}/api/auth/verify-email?token=${data.token}`;
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: "Verify your email address",
      react: React.createElement(EmailVerificationEmail, {
        email: data.email,
        verificationUrl,
        expiresAt: data.expiresAt,
      }),
    });
  }

  async sendPasswordReset(data: {
    email: string;
    token: string;
    expiresAt: string;
  }) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${data.token}`;
    return this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: "Reset your password",
      react: React.createElement(ResetPasswordEmail, {
        email: data.email,
        resetUrl,
        expiresAt: data.expiresAt,
      }),
    });
  }

  async sendOrgInvitation(data: {
    inviteeEmail: string;
    organizationName: string;
    invitedByName: string;
    roleName: string;
    token: string;
    expiresAt: string;
  }) {
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${data.token}`;
    return this.resend.emails.send({
      from: this.from,
      to: data.inviteeEmail,
      subject: `You've been invited to join ${data.organizationName}`,
      react: React.createElement(OrgInvitationEmail, {
        invitedByName: data.invitedByName,
        organizationName: data.organizationName,
        roleName: data.roleName,
        inviteUrl,
        expiresAt: data.expiresAt,
        inviteeEmail: data.inviteeEmail,
      }),
    });
  }

  async sendOrgMemberJoined(data: {
    notifyEmail: string;
    organizationName: string;
    organizationSlug: string;
    newMemberName: string;
    newMemberEmail: string;
    roleName: string;
  }) {
    const membersUrl = `${env.FRONTEND_URL}/organizations/${data.organizationSlug}/members`;
    return this.resend.emails.send({
      from: this.from,
      to: data.notifyEmail,
      subject: `New member joined ${data.organizationName}`,
      react: React.createElement(OrgMemberJoinedEmail, {
        organizationName: data.organizationName,
        organizationSlug: data.organizationSlug,
        newMemberName: data.newMemberName,
        newMemberEmail: data.newMemberEmail,
        roleName: data.roleName,
        membersUrl,
      }),
    });
  }

  async sendOrgRoleChanged(data: {
    memberEmail: string;
    memberName: string;
    organizationName: string;
    organizationSlug: string;
    oldRoleName: string;
    newRoleName: string;
  }) {
    const orgUrl = `${env.FRONTEND_URL}/organizations/${data.organizationSlug}`;
    return this.resend.emails.send({
      from: this.from,
      to: data.memberEmail,
      subject: `Your role in ${data.organizationName} has changed`,
      react: React.createElement(OrgRoleChangedEmail, {
        memberName: data.memberName,
        organizationName: data.organizationName,
        organizationSlug: data.organizationSlug,
        oldRoleName: data.oldRoleName,
        newRoleName: data.newRoleName,
        orgUrl,
      }),
    });
  }
}

export const mailer = Mailer.getInstance();
