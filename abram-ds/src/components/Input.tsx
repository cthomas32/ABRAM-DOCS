import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  id,
  style,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase" as const,
            color: "var(--abram-text-muted)",
            fontFamily: "var(--abram-font-sans)",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={className}
        style={{
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
          ...style,
        }}
        {...props}
      />
      {error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#f87171",
            fontFamily: "var(--abram-font-sans)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
