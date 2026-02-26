import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { EmailButton } from "./components/email-button.js";
import { EmailFooter } from "./components/email-footer.js";
import { EmailHeader } from "./components/email-header.js";

export interface OrgMemberJoinedEmailProps {
  organizationName?: string;
  organizationSlug?: string;
  newMemberName?: string;
  newMemberEmail?: string;
  roleName?: string;
  membersUrl?: string;
}

export function OrgMemberJoinedEmail({
  organizationName = "Acme Inc.",
  organizationSlug = "acme-inc",
  newMemberName = "New Member",
  newMemberEmail = "member@example.com",
  roleName = "member",
  membersUrl = "http://localhost:3000/organizations/acme-inc/members",
}: OrgMemberJoinedEmailProps) {
  const roleLabel = roleName.charAt(0).toUpperCase() + roleName.slice(1);
  const displayName =
    newMemberName && newMemberName !== newMemberEmail
      ? `${newMemberName} (${newMemberEmail})`
      : newMemberEmail;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {newMemberEmail} has joined {organizationName}.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>New Member Joined</Heading>

            <Text style={styles.text}>
              A new member has joined <strong>{organizationName}</strong> via an
              invitation.
            </Text>

            {/* Member card */}
            <Section style={styles.memberCard}>
              <Section style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(newMemberName || newMemberEmail).charAt(0).toUpperCase()}
                </Text>
              </Section>
              <Text style={styles.memberName}>{displayName}</Text>
              <Text style={styles.memberRole}>{roleLabel}</Text>
            </Section>

            <Text style={styles.text}>
              You're receiving this notification because you are an admin or
              owner of <strong>{organizationName}</strong>.
            </Text>

            <Section style={styles.ctaWrapper}>
              <EmailButton href={membersUrl}>View Members</EmailButton>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default OrgMemberJoinedEmail;

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
  memberCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    marginBottom: "24px",
    padding: "24px",
    textAlign: "center" as const,
  },
  avatar: {
    backgroundColor: "#4f46e5",
    borderRadius: "50%",
    display: "inline-block",
    height: "52px",
    margin: "0 auto 12px",
    width: "52px",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "52px",
    margin: "0",
    textAlign: "center" as const,
  },
  memberName: {
    color: "#1e293b",
    fontSize: "16px",
    fontWeight: "600",
    lineHeight: "1.4",
    margin: "0 0 4px",
  },
  memberRole: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.4",
    margin: "0",
  },
  ctaWrapper: {
    margin: "4px 0 28px",
    textAlign: "center" as const,
  },
};
