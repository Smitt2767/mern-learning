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

export interface OrgRoleChangedEmailProps {
  memberName?: string;
  organizationName?: string;
  organizationSlug?: string;
  oldRoleName?: string;
  newRoleName?: string;
  orgUrl?: string;
}

export function OrgRoleChangedEmail({
  memberName = "there",
  organizationName = "Acme Inc.",
  organizationSlug = "acme-inc",
  oldRoleName = "member",
  newRoleName = "admin",
  orgUrl = "http://localhost:3000/organizations/acme-inc",
}: OrgRoleChangedEmailProps) {
  const oldRoleLabel =
    oldRoleName.charAt(0).toUpperCase() + oldRoleName.slice(1);
  const newRoleLabel =
    newRoleName.charAt(0).toUpperCase() + newRoleName.slice(1);

  const isPromotion = getRoleWeight(newRoleName) > getRoleWeight(oldRoleName);

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your role in {organizationName} has changed to {newRoleLabel}.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />

          <Section style={styles.content}>
            <Heading style={styles.heading}>Your Role Has Changed</Heading>

            <Text style={styles.text}>Hi {memberName},</Text>

            <Text style={styles.text}>
              Your role in <strong>{organizationName}</strong> has been updated
              by an administrator.
            </Text>

            {/* Role change visual */}
            <Section style={styles.roleChangeBox}>
              <Section style={styles.roleItem}>
                <Text style={styles.roleChangeLabel}>Previous role</Text>
                <Text style={styles.roleOld}>{oldRoleLabel}</Text>
              </Section>

              <Text style={styles.arrow}>{isPromotion ? "→" : "→"}</Text>

              <Section style={styles.roleItem}>
                <Text style={styles.roleChangeLabel}>New role</Text>
                <Text style={styles.roleNew}>{newRoleLabel}</Text>
              </Section>
            </Section>

            {isPromotion ? (
              <Section style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🎉 Congratulations! You now have elevated permissions in{" "}
                  <strong>{organizationName}</strong>. Visit your organization
                  to see what's changed.
                </Text>
              </Section>
            ) : (
              <Section style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Your access level in <strong>{organizationName}</strong> has
                  been adjusted. If you have questions, please reach out to your
                  organization admin.
                </Text>
              </Section>
            )}

            <Section style={styles.ctaWrapper}>
              <EmailButton href={orgUrl}>Go to {organizationName}</EmailButton>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

export default OrgRoleChangedEmail;

/** Simple weight map so we can detect promotions vs demotions. */
function getRoleWeight(role: string): number {
  const weights: Record<string, number> = {
    member: 1,
    admin: 2,
    owner: 3,
  };
  return weights[role] ?? 1;
}

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
  roleChangeBox: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
    padding: "20px 24px",
    gap: "16px",
    textAlign: "center" as const,
  },
  roleItem: {
    flex: "1",
    textAlign: "center" as const,
  },
  roleChangeLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
  },
  roleOld: {
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "600",
    margin: "0",
    padding: "6px 14px",
    textDecoration: "line-through",
  },
  roleNew: {
    backgroundColor: "#ede9fe",
    borderRadius: "6px",
    color: "#4f46e5",
    fontSize: "15px",
    fontWeight: "700",
    margin: "0",
    padding: "6px 14px",
  },
  arrow: {
    color: "#94a3b8",
    fontSize: "20px",
    fontWeight: "400",
    margin: "0 8px",
    paddingTop: "16px",
  },
  infoBox: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "6px",
    marginBottom: "24px",
    padding: "14px 16px",
  },
  infoText: {
    color: "#0369a1",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
  },
  ctaWrapper: {
    margin: "4px 0 28px",
    textAlign: "center" as const,
  },
};
