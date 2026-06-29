// src/components/Button.tsx
import { jsx } from "react/jsx-runtime";
var sizeStyles = {
  default: { padding: "0.5rem 1.25rem", fontSize: "0.75rem" },
  sm: { padding: "0.375rem 1rem", fontSize: "0.75rem" },
  xs: { padding: "0.25rem 0.75rem", fontSize: "10px" }
};
function Button({
  variant = "glass",
  size = "default",
  children,
  className = "",
  style,
  ...props
}) {
  const btnClass = {
    primary: "btn-primary",
    glass: "btn-glass",
    ghost: "btn-ghost",
    danger: "btn-danger"
  }[variant];
  const sizeOverride = size !== "default" ? sizeStyles[size] : {};
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: `${btnClass} ${className}`,
      style: { ...sizeOverride, ...style },
      ...props,
      children
    }
  );
}

// src/components/GlassPanel.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function GlassPanel({
  hover = false,
  rounded = "2xl",
  children,
  className = "",
  style
}) {
  const radiusMap = { lg: "8px", xl: "12px", "2xl": "16px" };
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className: `glass-panel ${hover ? "glass-panel-hover" : ""} ${className}`,
      style: { borderRadius: radiusMap[rounded], ...style },
      children
    }
  );
}

// src/components/FeatureCard.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function FeatureCard({
  title,
  description,
  icon,
  href,
  horizontal = false,
  children,
  className = ""
}) {
  const content = /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "flex-start",
        gap: horizontal ? "1rem" : "0.75rem",
        padding: "1.25rem",
        height: "100%"
      },
      children: [
        icon && /* @__PURE__ */ jsx3(
          "div",
          {
            style: {
              display: "flex",
              height: "2.25rem",
              width: "2.25rem",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              background: "rgba(24, 24, 27, 0.6)",
              border: "1px solid #27272a",
              color: "#d4d4d8"
            },
            children: icon
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx3(
            "h4",
            {
              style: {
                fontFamily: "var(--abram-font-sans)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#f4f4f5",
                margin: 0
              },
              children: title
            }
          ),
          (description || children) && /* @__PURE__ */ jsx3(
            "div",
            {
              style: {
                marginTop: "0.25rem",
                fontSize: "0.75rem",
                color: "var(--abram-text-tertiary)",
                lineHeight: 1.6,
                fontFamily: "var(--abram-font-sans)"
              },
              children: description || children
            }
          )
        ] })
      ]
    }
  );
  const cardStyle = {
    display: "block",
    borderRadius: "8px",
    height: "100%",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit"
  };
  if (href) {
    return /* @__PURE__ */ jsx3("a", { href, className: `glass-panel glass-panel-hover ${className}`, style: cardStyle, children: content });
  }
  return /* @__PURE__ */ jsx3("div", { className: `glass-panel glass-panel-hover ${className}`, style: cardStyle, children: content });
}

// src/components/WorkflowCard.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function WorkflowCard({
  step,
  title,
  tag,
  description,
  children,
  className = ""
}) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      className: `glass-panel glass-panel-hover ${className}`,
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "12px",
        border: "1px solid var(--abram-border-ghost)",
        padding: "1rem",
        minHeight: "160px",
        height: "100%"
      },
      children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: [
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxs2(
            "span",
            {
              style: {
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--abram-text-muted)",
                fontFamily: "var(--abram-font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              },
              children: [
                "STEP ",
                step
              ]
            }
          ),
          /* @__PURE__ */ jsx4(
            "span",
            {
              style: {
                fontSize: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.03)",
                color: "var(--abram-text-muted)",
                fontFamily: "var(--abram-font-sans)",
                border: "1px solid rgba(255,255,255,0.03)"
              },
              children: tag
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx4(
            "h3",
            {
              style: {
                fontFamily: "var(--abram-font-sans)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#e4e4e7",
                margin: 0
              },
              children: title
            }
          ),
          /* @__PURE__ */ jsx4(
            "div",
            {
              style: {
                marginTop: "0.5rem",
                fontSize: "10px",
                color: "var(--abram-text-tertiary)",
                lineHeight: 1.6,
                fontFamily: "var(--abram-font-sans)"
              },
              children: description || children
            }
          )
        ] })
      ] })
    }
  );
}
function WorkflowCardGroup({ cols = 4, children, className = "" }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      className,
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1rem",
        margin: "1.5rem 0"
      },
      children
    }
  );
}

// src/components/Input.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function Input({
  label,
  error,
  className = "",
  id,
  style,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return /* @__PURE__ */ jsxs3("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
    label && /* @__PURE__ */ jsx5(
      "label",
      {
        htmlFor: inputId,
        style: {
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--abram-text-muted)",
          fontFamily: "var(--abram-font-sans)"
        },
        children: label
      }
    ),
    /* @__PURE__ */ jsx5(
      "input",
      {
        id: inputId,
        className,
        style: {
          width: "100%",
          height: "2.75rem",
          padding: "0 1rem",
          fontSize: "0.75rem",
          color: "#f4f4f5",
          fontFamily: "var(--abram-font-sans)",
          background: "rgba(9, 9, 11, 0.4)",
          borderRadius: "9999px",
          border: `1px solid ${error ? "rgba(239, 68, 68, 0.3)" : "var(--abram-border-ghost)"}`,
          outline: "none",
          transition: "all 0.2s ease",
          ...style
        },
        ...props
      }
    ),
    error && /* @__PURE__ */ jsx5(
      "span",
      {
        style: {
          fontSize: "0.75rem",
          color: "#f87171",
          fontFamily: "var(--abram-font-sans)"
        },
        children: error
      }
    )
  ] });
}

// src/components/Badge.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var variantStyles = {
  default: {
    background: "var(--abram-glass-bg)",
    border: "1px solid var(--abram-border-subtle)",
    color: "var(--abram-text-secondary)"
  },
  accent: {
    background: "rgba(206, 28, 28, 0.10)",
    border: "1px solid rgba(206, 28, 28, 0.20)",
    color: "#CE1C1C"
  },
  muted: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--abram-border-ghost)",
    color: "var(--abram-text-muted)"
  }
};
function Badge({ children, variant = "default", className = "" }) {
  return /* @__PURE__ */ jsx6(
    "span",
    {
      className,
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--abram-font-sans)",
        ...variantStyles[variant]
      },
      children
    }
  );
}

// src/components/Section.tsx
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
var maxWidthMap = {
  sm: "48rem",
  md: "64rem",
  lg: "80rem",
  xl: "90rem",
  full: "100%"
};
function Section({
  children,
  maxWidth = "lg",
  className = "",
  style
}) {
  return /* @__PURE__ */ jsx7(
    "section",
    {
      className,
      style: {
        width: "100%",
        maxWidth: maxWidthMap[maxWidth],
        marginLeft: "auto",
        marginRight: "auto",
        padding: "4rem 1.5rem",
        ...style
      },
      children
    }
  );
}
function SectionHeader({
  overline,
  title,
  description,
  align = "left",
  className = ""
}) {
  const textAlign = align === "center" ? "center" : "left";
  return /* @__PURE__ */ jsxs4("div", { className, style: { textAlign, marginBottom: "2rem" }, children: [
    overline && /* @__PURE__ */ jsx7(
      "span",
      {
        style: {
          display: "block",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--abram-text-muted)",
          fontFamily: "var(--abram-font-sans)",
          marginBottom: "0.5rem"
        },
        children: overline
      }
    ),
    /* @__PURE__ */ jsx7(
      "h2",
      {
        style: {
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: "#fafafa",
          fontFamily: "var(--abram-font-sans)",
          margin: 0
        },
        children: title
      }
    ),
    description && /* @__PURE__ */ jsx7(
      "p",
      {
        style: {
          marginTop: "0.5rem",
          fontSize: "1rem",
          lineHeight: 1.75,
          color: "var(--abram-text-tertiary)",
          fontFamily: "var(--abram-font-sans)",
          maxWidth: align === "center" ? "36rem" : void 0,
          marginLeft: align === "center" ? "auto" : void 0,
          marginRight: align === "center" ? "auto" : void 0
        },
        children: description
      }
    )
  ] });
}

// src/components/BackgroundGlow.tsx
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var presets = {
  premium: {
    center: "rgba(168, 85, 247, 0.12)",
    left: "rgba(2, 132, 199, 0.06)",
    right: "rgba(168, 85, 247, 0.06)"
  },
  brand: {
    center: "rgba(206, 28, 28, 0.06)",
    left: "rgba(142, 202, 255, 0.04)",
    right: "rgba(168, 85, 247, 0.04)"
  },
  space: {
    center: "rgba(255, 255, 255, 0.05)",
    left: "rgba(255, 255, 255, 0.01)",
    right: "rgba(255, 255, 255, 0.01)"
  },
  emerald: {
    center: "rgba(16, 185, 129, 0.10)",
    left: "rgba(20, 184, 166, 0.05)",
    right: "rgba(52, 211, 153, 0.05)"
  },
  amber: {
    center: "rgba(245, 158, 11, 0.08)",
    left: "rgba(251, 146, 60, 0.04)",
    right: "rgba(253, 224, 71, 0.04)"
  },
  rose: {
    center: "rgba(244, 63, 94, 0.10)",
    left: "rgba(168, 85, 247, 0.05)",
    right: "rgba(236, 72, 153, 0.05)"
  }
};
function BackgroundGlow({
  variant = "premium",
  techGrid = false,
  children,
  className = "",
  style
}) {
  const p = presets[variant];
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      className,
      style: {
        position: "relative",
        minHeight: "100vh",
        background: "var(--abram-bg-base)",
        fontFamily: "var(--abram-font-sans)",
        color: "var(--abram-cream)",
        ...style
      },
      children: [
        /* @__PURE__ */ jsx8(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
            radial-gradient(at 50% 0%, ${p.center} 0px, transparent 50%),
            radial-gradient(at 0% 0%, ${p.left} 0px, transparent 40%),
            radial-gradient(at 100% 0%, ${p.right} 0px, transparent 40%)
          `,
              backgroundAttachment: "fixed"
            }
          }
        ),
        techGrid && /* @__PURE__ */ jsx8(
          "div",
          {
            className: "tech-grid-overlay",
            style: {
              position: "absolute",
              inset: 0,
              opacity: 0.15,
              pointerEvents: "none"
            }
          }
        ),
        /* @__PURE__ */ jsx8("div", { style: { position: "relative", zIndex: 10, width: "100%", display: "flex", flexDirection: "column", flex: 1 }, children })
      ]
    }
  );
}
export {
  BackgroundGlow,
  Badge,
  Button,
  FeatureCard,
  GlassPanel,
  Input,
  Section,
  SectionHeader,
  WorkflowCard,
  WorkflowCardGroup
};
