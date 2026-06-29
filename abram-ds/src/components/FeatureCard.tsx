import React from "react";

export interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
  horizontal?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  href,
  horizontal = false,
  children,
  className = "",
}: FeatureCardProps) {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "flex-start",
        gap: horizontal ? "1rem" : "0.75rem",
        padding: "1.25rem",
        height: "100%",
      }}
    >
      {icon && (
        <div
          style={{
            display: "flex",
            height: "2.25rem",
            width: "2.25rem",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            background: "rgba(24, 24, 27, 0.6)",
            border: "1px solid #27272a",
            color: "#d4d4d8",
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontFamily: "var(--abram-font-sans)",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#f4f4f5",
            margin: 0,
          }}
        >
          {title}
        </h4>
        {(description || children) && (
          <div
            style={{
              marginTop: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--abram-text-tertiary)",
              lineHeight: 1.6,
              fontFamily: "var(--abram-font-sans)",
            }}
          >
            {description || children}
          </div>
        )}
      </div>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    display: "block",
    borderRadius: "8px",
    height: "100%",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
  };

  if (href) {
    return (
      <a href={href} className={`glass-panel glass-panel-hover ${className}`} style={cardStyle}>
        {content}
      </a>
    );
  }

  return (
    <div className={`glass-panel glass-panel-hover ${className}`} style={cardStyle}>
      {content}
    </div>
  );
}
