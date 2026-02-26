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

export interface OrgInvitationEmailProps {
  invitedByName?: string;
  organizationName?: string;
  roleName?: string;
  inviteUrl?: string;
  expiresAt?: string;
  inviteeEmail?: string;
}

export function OrgInvitationEmail({
  invitedByName = "A team member",
  organizationName = "Acme Inc.",
  roleName = "member",
  inviteUrl = "http://localhost:3000/invitations/preview-token",
  expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  inviteeEmail = "you@example.com",
}: OrgInvitationEmailProps) {
  const expiryDate = new Date(expiresAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const roleLabel = roleName.charAt(0).toUpperCase() + roleName.slice(1);

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {invitedByName} invited you to join {organizationName} on MERN.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>You're Invited!</Heading>

            <Text style={styles.text}>
              <strong>{invitedByName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> as a{" "}
              <strong>{roleLabel}</strong>.
            </Text>

            <Text style={styles.text}>
              You were invited as <strong>{inviteeEmail}</strong>. Click the
              button below to view your invitation and accept or decline.
            </Text>

            <Section style={styles.ctaWrapper}>
              <EmailButton href={inviteUrl}>View Invitation</EmailButton>
            </Section>

            {/* Role badge */}
            <Section style={styles.roleBox}>
              <Text style={styles.roleLabel}>Your role</Text>
              <Text style={styles.roleName}>{roleLabel}</Text>
            </Section>

            <Section style={styles.expiryBox}>
              <Text style={styles.expiryText}>
                ⏰ This invitation expires on <strong>{expiryDate}</strong>. If
                the button above doesn't work, copy and paste this URL into your
                browser:
              </Text>
              <Link href={inviteUrl} style={styles.link}>
                {inviteUrl}
              </Link>
            </Section>

            <Section style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                If you don't want to join <strong>{organizationName}</strong>,
                you can safely ignore this email or click the link above to
                decline the invitation.
              </Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default OrgInvitationEmail;

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
    margin: "28px 0 28px",
    textAlign: "center" as const,
  },
  roleBox: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    marginBottom: "20px",
    padding: "16px 20px",
    textAlign: "center" as const,
  },
  roleLabel: {
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
  },
  roleName: {
    color: "#0c4a6e",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0",
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
