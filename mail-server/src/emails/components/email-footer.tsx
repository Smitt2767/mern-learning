import { Hr, Section, Text } from "@react-email/components"
import * as React from "react"

export function EmailFooter() {
  return (
    <Section style={styles.wrapper}>
      <Hr style={styles.hr} />
      <Text style={styles.text}>
        © {new Date().getFullYear()} MERN App. All rights reserved.
      </Text>
      <Text style={styles.subtext}>
        You are receiving this email because you have an account with MERN App.
        If you have any questions, please contact our support team.
      </Text>
    </Section>
  )
}

const styles = {
  wrapper: {
    padding: "0 32px 32px",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "24px 0 20px",
  },
  text: {
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 4px",
    textAlign: "center" as const,
  },
  subtext: {
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0",
    textAlign: "center" as const,
  },
}
