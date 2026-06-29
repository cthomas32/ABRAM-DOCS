import React from "react";

export interface WorkflowCardProps {
  step: string;
  title: string;
  tag: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function WorkflowCard({
  step,
  title,
  tag,
  description,
  children,
  className = "",
}: WorkflowCardProps) {
  return (
    <div
      className={`glass-panel glass-panel-hover ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "12px",
        border: "1px solid var(--abram-border-ghost)",
        padding: "1rem",
        minHeight: "160px",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "var(--abram-text-muted)",
              fontFamily: "var(--abram-font-sans)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            STEP {step}
          </span>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.03)",
              color: "var(--abram-text-muted)",
              fontFamily: "var(--abram-font-sans)",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            {tag}
          </span>
        </div>
        <div>
          <h3
            style={{
              fontFamily: "var(--abram-font-sans)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#e4e4e7",
              margin: 0,
            }}
          >
            {title}
          </h3>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "10px",
              color: "var(--abram-text-tertiary)",
              lineHeight: 1.6,
              fontFamily: "var(--abram-font-sans)",
            }}
          >
            {description || children}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface WorkflowCardGroupProps {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function WorkflowCardGroup({ cols = 4, children, className = "" }: WorkflowCardGroupProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1rem",
        margin: "1.5rem 0",
      }}
    >
      {children}
    </div>
  );
}
