import React from "react";

export interface GlassPanelProps {
  hover?: boolean;
  rounded?: "lg" | "xl" | "2xl";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({
  hover = false,
  rounded = "2xl",
  children,
  className = "",
  style,
}: GlassPanelProps) {
  const radiusMap = { lg: "8px", xl: "12px", "2xl": "16px" };

  return (
    <div
      className={`glass-panel ${hover ? "glass-panel-hover" : ""} ${className}`}
      style={{ borderRadius: radiusMap[rounded], ...style }}
    >
      {children}
    </div>
  );
}
