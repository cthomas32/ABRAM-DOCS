import React from "react";

export interface SectionProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  style?: React.CSSProperties;
}

const maxWidthMap = {
  sm: "48rem",
  md: "64rem",
  lg: "80rem",
  xl: "90rem",
  full: "100%",
} as const;

export function Section({
  children,
  maxWidth = "lg",
  className = "",
  style,
}: SectionProps) {
  return (
    <section
      className={className}
      style={{
        width: "100%",
        maxWidth: maxWidthMap[maxWidth],
        marginLeft: "auto",
        marginRight: "auto",
        padding: "4rem 1.5rem",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  overline,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const textAlign = align === "center" ? "center" : "left";

  return (
    <div className={className} style={{ textAlign, marginBottom: "2rem" }}>
      {overline && (
        <span
          style={{
            display: "block",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--abram-text-muted)",
            fontFamily: "var(--abram-font-sans)",
            marginBottom: "0.5rem",
          }}
        >
          {overline}
        </span>
      )}
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: "#fafafa",
          fontFamily: "var(--abram-font-sans)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "var(--abram-text-tertiary)",
            fontFamily: "var(--abram-font-sans)",
            maxWidth: align === "center" ? "36rem" : undefined,
            marginLeft: align === "center" ? "auto" : undefined,
            marginRight: align === "center" ? "auto" : undefined,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
