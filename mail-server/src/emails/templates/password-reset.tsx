import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Password reset email template.
 *
 * Replaces the `console.log` TODO in auth-server's forgotPassword controller.
 * Red CTA communicates urgency (1-hour expiry) and distinguishes this email
 * visually from verify (indigo) and welcome (green).
 */
export function PasswordResetEmailTemplate({
  firstName,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your password — link expires in 1 hour</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Heading style={styles.heading}>Reset your password</Heading>

          {/* Body copy */}
          <Text style={styles.text}>Hi {firstName},</Text>
          <Text style={styles.text}>
            We received a request to reset the password for your account. Click
            the button below to choose a new password.
          </Text>
          <Text style={styles.text}>
            This link will expire in <strong>1 hour</strong>.
          </Text>

          {/* CTA */}
          <Section style={styles.buttonSection}>
            <Button href={resetUrl} style={styles.button}>
              Reset Password
            </Button>
          </Section>

          <Hr style={styles.hr} />

          {/* Fallback URL */}
          <Text style={styles.footer}>
            If the button doesn&apos;t work, copy and paste this URL:
          </Text>
          <Link href={resetUrl} style={styles.link}>
            {resetUrl}
          </Link>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            If you didn&apos;t request a password reset, you can safely ignore
            this email. Your password will not be changed.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Static metadata
PasswordResetEmailTemplate.subject = "Reset your password";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    margin: "0",
    padding: "0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e6ebf1",
    borderRadius: "8px",
    margin: "40px auto",
    maxWidth: "560px",
    padding: "40px 48px",
  },
  heading: {
    color: "#1a1a2e",
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 20px",
  },
  text: {
    color: "#4a5568",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  buttonSection: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#dc2626", // Red — conveys urgency
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "16px",
    fontWeight: "600",
    padding: "12px 32px",
    textDecoration: "none",
  },
  hr: {
    borderColor: "#e6ebf1",
    margin: "24px 0",
  },
  footer: {
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 8px",
  },
  link: {
    color: "#dc2626",
    fontSize: "13px",
    wordBreak: "break-all" as const,
  },
} as const;
