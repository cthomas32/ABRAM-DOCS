"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { resolveDocLink } from "./MdxLink";

// Convert kebab-case/lowercase icon names to PascalCase for Lucide icons
function getIconComponent(iconName?: string) {
  if (!iconName) return null;
  const pascalName = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>;
  return icons[pascalName] || icons[iconName] || LucideIcons.HelpCircle;
}

interface CardProps {
  title: string;
  icon?: string;
  href?: string;
  children: React.ReactNode;
  horizontal?: boolean;
}

export default function MdxCard({
  title,
  icon,
  href,
  children,
  horizontal = false,
}: CardProps) {
  const pathname = usePathname() || "";
  const IconComponent = getIconComponent(icon);

  const cardContent = (
    <div className={`flex ${horizontal ? "flex-row items-center gap-4" : "flex-col gap-3"} p-5 h-full`}>
      {IconComponent && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-300">
          {React.createElement(IconComponent, { className: "h-5 w-5" })}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h4>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed [&_p]:text-xs [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400 [&_p]:my-0 [&_p]:leading-relaxed font-normal font-sans">
          {children}
        </div>
      </div>
    </div>
  );

  const className = "block rounded-lg glass-panel glass-panel-hover h-full overflow-hidden no-underline";

  if (href) {
    const resolvedHref = resolveDocLink(href, pathname);
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("//");

    if (isExternal) {
      return (
        <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className={className}>
          {cardContent}
        </a>
      );
    }

    return (
      <Link href={resolvedHref} className={className}>
        {cardContent}
      </Link>
    );
  }

  return <div className={className}>{cardContent}</div>;
}
