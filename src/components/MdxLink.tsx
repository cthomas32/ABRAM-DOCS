"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Resolves internal/relative documentation links to valid Next.js route paths.
 * 
 * Examples:
 * - "/user-guide/1.1-signing-in-and-onboarding" -> "/docs/user-guide/1.1-signing-in-and-onboarding"
 * - "./3.2-work-packages-and-milestones.md" on "/docs/user-guide/0.0-..." -> "/docs/user-guide/3.2-work-packages-and-milestones"
 * - "3.2-work-packages-and-milestones.md" -> "/docs/user-guide/3.2-work-packages-and-milestones"
 * - "../another/page.md" on "/docs/user-guide/sub/current" -> "/docs/user-guide/another/page"
 */
export function resolveDocLink(href: string, pathname: string): string {
  if (!href) return "";

  // Check if link is external or an anchor on the same page
  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("//") ||
    href.startsWith("#");

  if (isExternal) {
    return href;
  }

  // Handle hash anchors if present
  let resolvedHref = href;
  const hashIndex = resolvedHref.indexOf("#");
  let hash = "";
  if (hashIndex !== -1) {
    hash = resolvedHref.substring(hashIndex);
    resolvedHref = resolvedHref.substring(0, hashIndex);
  }

  // Clean extension (.md, .mdx)
  resolvedHref = resolvedHref.replace(/\.mdx?$/, "");

  if (resolvedHref.startsWith("/")) {
    // Convert root-relative /user-guide/... to /docs/user-guide/...
    if (resolvedHref.startsWith("/user-guide/")) {
      resolvedHref = "/docs" + resolvedHref;
    }
  } else {
    // Relative link: resolve based on current route pathname
    // e.g. pathname = /docs/user-guide/0.0-agent-and-human-navigation-guide
    const parts = pathname.split("/").filter(Boolean); // ["docs", "user-guide", "0.0-agent-and-human-navigation-guide"]
    if (parts.length > 0) {
      parts.pop(); // Remove the current file segment to get directory context: ["docs", "user-guide"]
    }

    const hrefParts = resolvedHref.split("/");
    for (const part of hrefParts) {
      if (part === "." || part === "") {
        continue;
      } else if (part === "..") {
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    resolvedHref = "/" + parts.join("/");
  }

  return resolvedHref + hash;
}

interface MdxLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children: React.ReactNode;
}

function parseInlineStyle(style: any): React.CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === "object") return style as React.CSSProperties;
  if (typeof style === "string") {
    const styleObj: Record<string, string> = {};
    style.split(";").forEach((rules) => {
      const parts = rules.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const val = parts.slice(1).join(":").trim();
        if (key && val) {
          styleObj[key] = val;
        }
      }
    });
    return styleObj as React.CSSProperties;
  }
  return undefined;
}

function getSafeProps<T extends { style?: any }>(props: T): Omit<T, "style"> & { style?: React.CSSProperties } {
  const { style, ...rest } = props;
  return {
    ...rest,
    ...(style ? { style: parseInlineStyle(style) } : {}),
  } as any;
}

export default function MdxLink({ href, children, ...props }: MdxLinkProps) {
  const pathname = usePathname() || "";
  const className =
    "text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4 hover:decoration-zinc-900 dark:hover:decoration-zinc-100 font-medium transition-colors duration-200";

  const safeProps = getSafeProps(props);

  if (!href) {
    return (
      <span className={className} {...safeProps}>
        {children}
      </span>
    );
  }

  const resolvedHref = resolveDocLink(href, pathname);

  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("//");

  if (isExternal) {
    return (
      <a
        href={resolvedHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...safeProps}
      >
        {children}
      </a>
    );
  }

  // Same page hash link
  if (href.startsWith("#")) {
    return (
      <a href={resolvedHref} className={className} {...safeProps}>
        {children}
      </a>
    );
  }

  return (
    <Link href={resolvedHref} className={className} {...safeProps}>
      {children}
    </Link>
  );
}
