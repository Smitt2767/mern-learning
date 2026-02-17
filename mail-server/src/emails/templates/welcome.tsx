import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// ─── Props ────────────────────────────────────────────────────────────────────

interface WelcomeEmailProps {
  firstName: string;
  loginUrl: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Welcome email template — sent once after email verification succeeds.
 *
 * .subject is a function here (not a string) because it interpolates
 * the user's first name.  Call it when sending:
 *
 *   subject: WelcomeEmailTemplate.subject(data.firstName)
 */
export function WelcomeEmailTemplate({
  firstName,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome aboard, {firstName} — your account is ready!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Heading style={styles.heading}>Welcome, {firstName}! 🎉</Heading>

          {/* Body copy */}
          <Text style={styles.text}>
            Your email has been verified and your account is all set. We&apos;re
            excited to have you on board!
          </Text>
          <Text style={styles.text}>
            Click the button below to sign in and get started.
          </Text>

          {/* CTA */}
          <Section style={styles.buttonSection}>
            <Button href={loginUrl} style={styles.button}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Need help? Just reply to this email — we&apos;re always happy to
            assist.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Static metadata
WelcomeEmailTemplate.subject = (firstName: string) =>
  `Welcome aboard, ${firstName}!`;

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
    backgroundColor: "#059669", // Green — distinct from verify (indigo) and reset (red)
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
    margin: "0",
  },
} as const;
