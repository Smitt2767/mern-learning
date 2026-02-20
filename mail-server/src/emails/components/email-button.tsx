import { Button } from "@react-email/components"
import * as React from "react"

interface EmailButtonProps {
  href: string
  children: React.ReactNode
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button href={href} style={styles.button}>
      {children}
    </Button>
  )
}

const styles = {
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    lineHeight: "1",
    padding: "14px 32px",
    textDecoration: "none",
    textAlign: "center" as const,
  },
}
