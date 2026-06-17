import React from "react";

export interface BackgroundGlowProps {
  /**
   * Preset gradient styles:
   * - 'premium': The high-contrast Violet/Blue docs theme (bg-black)
   * - 'brand': The warm Red/Blue/Purple brand theme (bg-abram-black)
   * - 'space': Radial space gray centered glow
   * - 'emerald': Emerald green and mint glows
   * - 'amber': Amber, orange, and yellow warm glows
   * - 'rose': Vibrant rose and pink glows
   * - 'custom': Configure custom RGB/RGBA or hex colors using props
   */
  variant?: "premium" | "brand" | "space" | "emerald" | "amber" | "rose" | "custom";
  
  /** Base background color tailwind class, defaults to matching the variant */
  baseColor?: string;
  
  /** Center glow color (used when variant = 'custom') */
  centerColor?: string;
  /** Left glow color (used when variant = 'custom') */
  leftColor?: string;
  /** Right glow color (used when variant = 'custom') */
  rightColor?: string;

  /** Height class for the container, defaults to 'min-h-screen' */
  heightClass?: string;

  /** Show grid lines texture overlay */
  techGrid?: boolean;
  /** Show subtle film grain SVG texture overlay */
  grain?: boolean;
  /** Lock glows relative to the viewport during scrolls */
  fixed?: boolean;

  children?: React.ReactNode;
  className?: string;
}

export default function BackgroundGlow({
  variant = "premium",
  baseColor,
  centerColor,
  leftColor,
  rightColor,
  heightClass = "min-h-screen",
  techGrid = false,
  grain = false,
  fixed = true,
  children,
  className = "",
}: BackgroundGlowProps) {
  // Preset definitions
  const presets = {
    premium: {
      bg: "bg-black",
      center: "rgba(168, 85, 247, 0.12)",
      left: "rgba(2, 132, 199, 0.06)",
      right: "rgba(168, 85, 247, 0.06)",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0px, transparent 50%),
        radial-gradient(at 0% 0%, var(--glow-left) 0px, transparent 40%),
        radial-gradient(at 100% 0%, var(--glow-right) 0px, transparent 40%)
      `
    },
    brand: {
      bg: "bg-abram-black",
      center: "rgba(206, 28, 28, 0.06)",
      left: "rgba(142, 202, 255, 0.04)",
      right: "rgba(168, 85, 247, 0.04)",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0%, rgba(206, 28, 28, 0.0511) 5%, rgba(206, 28, 28, 0.043) 10%, rgba(206, 28, 28, 0.0288) 20%, rgba(206, 28, 28, 0.0174) 30%, rgba(206, 28, 28, 0.0089) 40%, rgba(206, 28, 28, 0.0032) 50%, rgba(206, 28, 28, 0.0014) 55%, rgba(206, 28, 28, 0.0004) 60%, rgba(206, 28, 28, 0) 65%),
        radial-gradient(at 0% 0%, var(--glow-left) 0%, rgba(142, 202, 255, 0.0324) 5%, rgba(142, 202, 255, 0.0256) 10%, rgba(142, 202, 255, 0.0196) 15%, rgba(142, 202, 255, 0.0144) 20%, rgba(142, 202, 255, 0.01) 25%, rgba(142, 202, 255, 0.0064) 30%, rgba(142, 202, 255, 0) 50%),
        radial-gradient(at 100% 0%, var(--glow-right) 0%, rgba(168, 85, 247, 0.0324) 5%, rgba(168, 85, 247, 0.0256) 10%, rgba(168, 85, 247, 0.0196) 15%, rgba(168, 85, 247, 0.0144) 20%, rgba(168, 85, 247, 0.01) 25%, rgba(168, 85, 247, 0.0064) 30%, rgba(168, 85, 247, 0) 50%)
      `
    },
    space: {
      bg: "bg-black",
      center: "rgba(255, 255, 255, 0.05)",
      left: "rgba(255, 255, 255, 0.01)",
      right: "rgba(255, 255, 255, 0.01)",
      gradient: `
        radial-gradient(circle at 50% 50%, var(--glow-center) 0%, transparent 70%)
      `
    },
    emerald: {
      bg: "bg-black",
      center: "rgba(16, 185, 129, 0.10)",
      left: "rgba(20, 184, 166, 0.05)",
      right: "rgba(52, 211, 153, 0.05)",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0px, transparent 50%),
        radial-gradient(at 0% 0%, var(--glow-left) 0px, transparent 40%),
        radial-gradient(at 100% 0%, var(--glow-right) 0px, transparent 40%)
      `
    },
    amber: {
      bg: "bg-black",
      center: "rgba(245, 158, 11, 0.08)",
      left: "rgba(251, 146, 60, 0.04)",
      right: "rgba(253, 224, 71, 0.04)",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0px, transparent 50%),
        radial-gradient(at 0% 0%, var(--glow-left) 0px, transparent 40%),
        radial-gradient(at 100% 0%, var(--glow-right) 0px, transparent 40%)
      `
    },
    rose: {
      bg: "bg-black",
      center: "rgba(244, 63, 94, 0.10)",
      left: "rgba(168, 85, 247, 0.05)",
      right: "rgba(236, 72, 153, 0.05)",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0px, transparent 50%),
        radial-gradient(at 0% 0%, var(--glow-left) 0px, transparent 40%),
        radial-gradient(at 100% 0%, var(--glow-right) 0px, transparent 40%)
      `
    },
    custom: {
      bg: "bg-black",
      center: centerColor || "rgba(255, 255, 255, 0.05)",
      left: leftColor || "transparent",
      right: rightColor || "transparent",
      gradient: `
        radial-gradient(at 50% 0%, var(--glow-center) 0px, transparent 50%),
        radial-gradient(at 0% 0%, var(--glow-left) 0px, transparent 40%),
        radial-gradient(at 100% 0%, var(--glow-right) 0px, transparent 40%)
      `
    }
  };

  const currentPreset = presets[variant] || presets.premium;
  const resolvedBg = baseColor || currentPreset.bg;

  const styleVariables = {
    "--glow-center": variant === "custom" ? centerColor : currentPreset.center,
    "--glow-left": variant === "custom" ? leftColor : currentPreset.left,
    "--glow-right": variant === "custom" ? rightColor : currentPreset.right,
  } as React.CSSProperties;

  return (
    <div
      style={styleVariables}
      className={`relative ${heightClass} text-foreground font-sans ${resolvedBg} ${className}`}
    >
      {/* Viewport-fixed or Scrollable Gradient layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: currentPreset.gradient,
          backgroundAttachment: fixed ? "fixed" : "scroll",
        }}
      />

      {/* Tech Grid Overlay */}
      {techGrid && (
        <div className="absolute inset-0 tech-grid-overlay opacity-[0.15] pointer-events-none z-0" />
      )}

      {/* Film Grain Texture */}
      {grain && (
        <div className="grain-overlay pointer-events-none fixed inset-0 z-50 opacity-[0.02]" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
