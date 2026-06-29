import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost" | "danger";
  size?: "default" | "sm" | "xs";
  children: React.ReactNode;
}

const sizeStyles = {
  default: { padding: "0.5rem 1.25rem", fontSize: "0.75rem" },
  sm: { padding: "0.375rem 1rem", fontSize: "0.75rem" },
  xs: { padding: "0.25rem 0.75rem", fontSize: "10px" },
} as const;

export function Button({
  variant = "glass",
  size = "default",
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const btnClass = {
    primary: "btn-primary",
    glass: "btn-glass",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];

  const sizeOverride = size !== "default" ? sizeStyles[size] : {};

  return (
    <button
      className={`${btnClass} ${className}`}
      style={{ ...sizeOverride, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
