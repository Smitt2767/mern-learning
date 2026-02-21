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
} from "@react-email/components";

import { EmailButton } from "./components/email-button.js";
import { EmailFooter } from "./components/email-footer.js";
import { EmailHeader } from "./components/email-header.js";

export interface EmailVerificationProps {
  email?: string;
  verificationUrl?: string;
  expiresAt?: string;
}

export function EmailVerificationEmail({
  email = "user@example.com",
  verificationUrl = "http://localhost:3000/verify-email?token=preview-token",
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}: EmailVerificationProps) {
  const expiryDate = new Date(expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Verify your email address to activate your MERN account.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>Verify Your Email</Heading>
            <Text style={styles.text}>
              Thanks for signing up! Please verify your email address to
              activate your account and start using MERN.
            </Text>
            <Text style={styles.emailLabel}>
              Verifying: <strong>{email}</strong>
            </Text>

            <Section style={styles.ctaWrapper}>
              <EmailButton href={verificationUrl}>
                Verify Email Address
              </EmailButton>
            </Section>

            <Section style={styles.expiryBox}>
              <Text style={styles.expiryText}>
                ⏰ This link expires on <strong>{expiryDate}</strong>. If the
                button above doesn't work, copy and paste this URL into your
                browser:
              </Text>
              <Link href={verificationUrl} style={styles.link}>
                {verificationUrl}
              </Link>
            </Section>

            <Section style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                Didn't create an account with MERN? You can safely ignore this
                email — no account will be created without verification.
              </Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default EmailVerificationEmail;

const styles = {
  body: {
    backgroundColor: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0",
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
  emailLabel: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 4px",
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
  disclaimerBox: {
    backgroundColor: "#fef9ee",
    border: "1px solid #fde68a",
    borderRadius: "6px",
    marginBottom: "24px",
    padding: "14px 16px",
  },
  disclaimerText: {
    color: "#92400e",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0",
  },
};
