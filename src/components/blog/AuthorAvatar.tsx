"use client";

import React, { useState } from "react";

interface AuthorAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AuthorAvatar({ src, name, size = "sm", className }: AuthorAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-5 h-5 text-[9px]",
    md: "w-8 h-8 text-xs",
    lg: "w-14 h-14 text-sm font-semibold",
  };

  const currentClass = className || sizeClasses[size];

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "A";

  if (!src || imageError) {
    return (
      <div className={`${currentClass} rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 select-none shrink-0 font-sans`}>
        {size === "lg" ? initials : initials.slice(0, 1)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImageError(true)}
      className={`${currentClass} rounded-full object-cover border border-white/10 shrink-0 select-none pointer-events-none`}
    />
  );
}
