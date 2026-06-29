import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted";
  className?: string;
}

const variantStyles = {
  default: {
    background: "var(--abram-glass-bg)",
    border: "1px solid var(--abram-border-subtle)",
    color: "var(--abram-text-secondary)",
  },
  accent: {
    background: "rgba(206, 28, 28, 0.10)",
    border: "1px solid rgba(206, 28, 28, 0.20)",
    color: "#CE1C1C",
  },
  muted: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--abram-border-ghost)",
    color: "var(--abram-text-muted)",
  },
} as const;

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--abram-font-sans)",
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
