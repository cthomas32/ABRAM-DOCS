import React from "react";

export interface BackgroundGlowProps {
  variant?: "premium" | "brand" | "space" | "emerald" | "amber" | "rose";
  techGrid?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const presets = {
  premium: {
    center: "rgba(168, 85, 247, 0.12)",
    left: "rgba(2, 132, 199, 0.06)",
    right: "rgba(168, 85, 247, 0.06)",
  },
  brand: {
    center: "rgba(206, 28, 28, 0.06)",
    left: "rgba(142, 202, 255, 0.04)",
    right: "rgba(168, 85, 247, 0.04)",
  },
  space: {
    center: "rgba(255, 255, 255, 0.05)",
    left: "rgba(255, 255, 255, 0.01)",
    right: "rgba(255, 255, 255, 0.01)",
  },
  emerald: {
    center: "rgba(16, 185, 129, 0.10)",
    left: "rgba(20, 184, 166, 0.05)",
    right: "rgba(52, 211, 153, 0.05)",
  },
  amber: {
    center: "rgba(245, 158, 11, 0.08)",
    left: "rgba(251, 146, 60, 0.04)",
    right: "rgba(253, 224, 71, 0.04)",
  },
  rose: {
    center: "rgba(244, 63, 94, 0.10)",
    left: "rgba(168, 85, 247, 0.05)",
    right: "rgba(236, 72, 153, 0.05)",
  },
} as const;

export function BackgroundGlow({
  variant = "premium",
  techGrid = false,
  children,
  className = "",
  style,
}: BackgroundGlowProps) {
  const p = presets[variant];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--abram-bg-base)",
        fontFamily: "var(--abram-font-sans)",
        color: "var(--abram-cream)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(at 50% 0%, ${p.center} 0px, transparent 50%),
            radial-gradient(at 0% 0%, ${p.left} 0px, transparent 40%),
            radial-gradient(at 100% 0%, ${p.right} 0px, transparent 40%)
          `,
          backgroundAttachment: "fixed",
        }}
      />
      {techGrid && (
        <div
          className="tech-grid-overlay"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
