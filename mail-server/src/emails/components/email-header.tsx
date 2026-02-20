import { Section, Text } from "@react-email/components"
import * as React from "react"

export function EmailHeader() {
  return (
    <Section style={styles.wrapper}>
      <Text style={styles.logo}>MERN</Text>
    </Section>
  )
}

const styles = {
  wrapper: {
    backgroundColor: "#4f46e5",
    borderRadius: "8px 8px 0 0",
    padding: "24px 32px",
    textAlign: "center" as const,
  },
  logo: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "4px",
    margin: "0",
    textTransform: "uppercase" as const,
  },
}
