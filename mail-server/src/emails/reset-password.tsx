import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

import { EmailButton } from "./components/email-button.js"
import { EmailFooter } from "./components/email-footer.js"
import { EmailHeader } from "./components/email-header.js"

export interface ResetPasswordProps {
  email?: string
  resetUrl?: string
  expiresAt?: string
}

export function ResetPasswordEmail({
  email = "user@example.com",
  resetUrl = "http://localhost:3000/reset-password?token=preview-token",
  expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}: ResetPasswordProps) {
  const expiryDate = new Date(expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your MERN password — this link expires in 1 hour.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>Reset Your Password</Heading>
            <Text style={styles.text}>
              We received a request to reset the password for your MERN account
              associated with <strong>{email}</strong>.
            </Text>
            <Text style={styles.text}>
              Click the button below to choose a new password. This link is
              valid for a limited time only.
            </Text>

            <Section style={styles.ctaWrapper}>
              <EmailButton href={resetUrl}>Reset Password</EmailButton>
            </Section>

            <Section style={styles.expiryBox}>
              <Text style={styles.expiryText}>
                ⏰ This link expires on <strong>{expiryDate}</strong>. If the
                button above doesn't work, copy and paste this URL into your
                browser:
              </Text>
              <Link href={resetUrl} style={styles.link}>
                {resetUrl}
              </Link>
            </Section>

            <Section style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Didn't request this?</Text>
              <Text style={styles.warningText}>
                If you did not request a password reset, please ignore this
                email. Your password will remain unchanged and the link will
                expire automatically. If you're concerned about your account
                security, consider changing your password after logging in.
              </Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

export default ResetPasswordEmail

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0",
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)",
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden",
  },
  content: {
    padding: "32px 32px 8px",
  },
  heading: {
    color: "#1e293b",
    fontSize: "26px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  text: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 14px",
  },
  ctaWrapper: {
    margin: "28px 0 28px",
    textAlign: "center" as const,
  },
  expiryBox: {
    backgroundColor: "#f8fafc",
    borderLeft: "3px solid #4f46e5",
    borderRadius: "4px",
    marginBottom: "20px",
    padding: "14px 16px",
  },
  expiryText: {
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 8px",
  },
  link: {
    color: "#4f46e5",
    fontSize: "12px",
    overflowWrap: "break-word" as const,
    wordBreak: "break-all" as const,
  },
  warningBox: {
    backgroundColor: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: "6px",
    marginBottom: "24px",
    padding: "14px 16px",
  },
  warningTitle: {
    color: "#9f1239",
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.4",
    margin: "0 0 6px",
  },
  warningText: {
    color: "#9f1239",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0",
  },
}
