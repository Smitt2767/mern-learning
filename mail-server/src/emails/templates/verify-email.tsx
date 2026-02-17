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

interface VerifyEmailProps {
  firstName: string;
  verificationUrl: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Email verification template.
 *
 * Rendered server-side with @react-email/render — produces both HTML
 * and a plain-text fallback automatically.
 *
 * Static properties (.subject) are attached below the component so they
 * can be imported alongside the component itself:
 *
 *   import { VerifyEmailTemplate } from './verify-email.js';
 *   const html = await render(<VerifyEmailTemplate ... />);
 *   resend.emails.send({ subject: VerifyEmailTemplate.subject, html });
 */
export function VerifyEmailTemplate({
  firstName,
  verificationUrl,
}: VerifyEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your email address to activate your account</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Heading style={styles.heading}>Hi {firstName} 👋</Heading>

          {/* Body copy */}
          <Text style={styles.text}>
            Thanks for signing up! To get started, please verify your email
            address by clicking the button below.
          </Text>
          <Text style={styles.text}>
            This link will expire in <strong>24 hours</strong>.
          </Text>

          {/* CTA button */}
          <Section style={styles.buttonSection}>
            <Button href={verificationUrl} style={styles.button}>
              Verify Email Address
            </Button>
          </Section>

          <Hr style={styles.hr} />

          {/* Fallback URL */}
          <Text style={styles.footer}>
            If the button doesn&apos;t work, copy and paste this URL into your
            browser:
          </Text>
          <Link href={verificationUrl} style={styles.link}>
            {verificationUrl}
          </Link>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            If you didn&apos;t create an account, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Static metadata — co-located with the template so you never drift
VerifyEmailTemplate.subject = "Verify your email address";

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
    backgroundColor: "#4f46e5",
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
    color: "#4f46e5",
    fontSize: "13px",
    wordBreak: "break-all" as const,
  },
} as const;
