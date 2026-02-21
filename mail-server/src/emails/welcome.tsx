import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { EmailButton } from "./components/email-button.js";
import { EmailFooter } from "./components/email-footer.js";
import { EmailHeader } from "./components/email-header.js";

export interface WelcomeEmailProps {
  firstName?: string;
}

export function WelcomeEmail({ firstName = "there" }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to MERN! We're excited to have you on board.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>Welcome, {firstName}!</Heading>
            <Text style={styles.text}>
              We're thrilled to have you on board. Your account has been
              successfully created and you're all set to get started.
            </Text>
            <Text style={styles.text}>
              Explore everything the platform has to offer — from secure
              authentication to profile management and OAuth integrations.
            </Text>

            <Section style={styles.ctaWrapper}>
              <EmailButton href="http://localhost:3000">
                Get Started
              </EmailButton>
            </Section>

            <Hr style={styles.hr} />

            <Heading as="h2" style={styles.subheading}>
              What's included
            </Heading>

            <Section style={styles.feature}>
              <Text style={styles.featureTitle}>🔐 Secure Authentication</Text>
              <Text style={styles.featureText}>
                Industry-standard JWT-based auth with session management and
                refresh tokens keeps your account protected.
              </Text>
            </Section>

            <Section style={styles.feature}>
              <Text style={styles.featureTitle}>👤 Profile Management</Text>
              <Text style={styles.featureText}>
                Update your personal information, change your password, and
                manage your account settings anytime.
              </Text>
            </Section>

            <Section style={styles.feature}>
              <Text style={styles.featureTitle}>🔗 OAuth Integration</Text>
              <Text style={styles.featureText}>
                Connect your GitHub or Google account for faster, seamless
                sign-in options.
              </Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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
  ctaWrapper: {
    margin: "28px 0 32px",
    textAlign: "center" as const,
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "32px 0 28px",
  },
  subheading: {
    color: "#1e293b",
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1.3",
    margin: "0 0 20px",
  },
  feature: {
    marginBottom: "20px",
  },
  featureTitle: {
    color: "#1e293b",
    fontSize: "15px",
    fontWeight: "600",
    lineHeight: "1.4",
    margin: "0 0 4px",
  },
  featureText: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
  },
};
