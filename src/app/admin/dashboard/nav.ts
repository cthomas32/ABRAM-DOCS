import {
  Banknote,
  Building2,
  Contact,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Phone,
  UsersRound,
} from "lucide-react";
import type React from "react";
import type { Permission } from "@/lib/auth/permissions";

/**
 * Where you can go: nine rows, two groups.
 *
 * There were twenty destinations in six groups, and the founder counted
 * them twice. The count was the symptom; the cause was that the console
 * had a page per *verb* — a list, a board, a queue, a report, a set of
 * saved filters — when a person thinks in *objects*. Nine of those pages
 * were four things.
 *
 * So the shape is the product's own project screen. An object is one
 * address, and every way of looking at it is a tab on that address, in
 * the URL, so it can be linked and bookmarked and redirected to.
 *
 *   CRM          The four objects, plus the door they share.
 *                People carries its lists, sequences and imports.
 *                Deals carries its board, forecast and registrations.
 *                Activities carries tasks, calls, email and notes.
 *   Console      The four tool sets that are not the CRM. Each one is a
 *                page of tabs for what used to be a row apiece.
 *
 * What went and did not come back: the subscribers screen. A subscriber
 * was never a second kind of person, and treating it as one is what let
 * the same human be counted twice. It is a lifecycle value on a contact
 * and a built-in list on the people screen.
 *
 * Every entry declares the permission it needs, and the list is filtered
 * before it is drawn. That is not only politeness: a menu showing doors
 * somebody cannot open also tells them the shape of what everybody else
 * can do, which is not information a console should volunteer.
 *
 * The command palette reads this same list, so a destination added here
 * is searchable the moment it is navigable.
 */

export interface AdminNavLink {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** One line under the label on mobile, and in the command palette. */
  hint: string;
  permission: Permission;
  /** Extra words the palette matches on but the sidebar never shows. */
  keywords?: string[];
  /** Draws the open follow up count beside the label. One link uses this. */
  countsTasks?: boolean;
}

export interface AdminNavGroup {
  id: string;
  label: string | null;
  links: AdminNavLink[];
}

export const NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "crm",
    label: "CRM",
    links: [
      {
        id: "home",
        label: "CRM Home",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        hint: "The four objects, and what each one holds",
        permission: "console.admin",
        keywords: ["overview", "dashboard", "home", "funnel"],
      },
      {
        id: "contacts",
        label: "People",
        href: "/admin/dashboard/crm/people",
        icon: Contact,
        hint: "Every person, wherever they came from",
        permission: "crm.contacts.read.own",
        keywords: [
          "contacts",
          "leads",
          "subscribers",
          "lists",
          "segments",
          "sequences",
          "import",
          "export",
          "events",
          "codes",
          "card",
        ],
      },
      {
        id: "accounts",
        label: "Companies",
        href: "/admin/dashboard/accounts",
        icon: Building2,
        hint: "Accounts, and what pays commission",
        permission: "crm.accounts.manage",
        keywords: ["accounts", "organisations", "comped", "carve out"],
      },
      {
        id: "deals",
        label: "Deals",
        href: "/admin/dashboard/deals",
        icon: Handshake,
        hint: "What is open, the board, and the forecast",
        permission: "crm.deals.manage",
        keywords: ["board", "kanban", "pipeline", "forecast", "registrations"],
      },
      {
        id: "activities",
        label: "Activities",
        href: "/admin/dashboard/activities",
        icon: Phone,
        hint: "Follow ups, calls, email and notes",
        permission: "crm.contacts.read.own",
        keywords: ["tasks", "queue", "overdue", "calls", "meetings", "notes", "timeline"],
        countsTasks: true,
      },
    ],
  },
  {
    id: "console",
    label: "Console",
    links: [
      {
        id: "growth",
        label: "Growth tools",
        href: "/admin/dashboard/growth",
        icon: Megaphone,
        hint: "Traffic, email, codes, pages, social and links",
        permission: "console.admin",
        keywords: [
          "broadcast",
          "newsletter",
          "campaigns",
          "promotions",
          "discount",
          "social",
          "link hub",
          "analytics",
          "traffic",
        ],
      },
      {
        id: "content",
        label: "Content",
        href: "/admin/dashboard/content",
        icon: Newspaper,
        hint: "Blog, docs and release notes",
        permission: "console.admin",
        keywords: ["blog", "docs", "help", "changelog", "release notes"],
      },
      {
        id: "money",
        label: "Money",
        href: "/admin/dashboard/money",
        icon: Banknote,
        hint: "Earnings, revenue, reports and commission",
        permission: "commission.read.own",
        keywords: ["earnings", "commission", "payout", "revenue", "collections", "reports"],
      },
      {
        id: "team",
        label: "Team",
        href: "/admin/dashboard/team",
        icon: UsersRound,
        hint: "Who works here, and what their login can do",
        permission: "console.admin",
        keywords: ["roles", "permissions", "invite", "bylines", "authors", "access"],
      },
    ],
  },
];

/** The groups this person may actually enter, with empty ones dropped. */
export function visibleGroups(permissions: Iterable<Permission>): AdminNavGroup[] {
  const held = new Set(permissions);
  return NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => held.has(link.permission)),
  })).filter((group) => group.links.length > 0);
}

/**
 * The row to light up.
 *
 * Longest match wins, so /deals/board lights Deals rather than lighting
 * nothing, and /admin/dashboard only lights Overview when it is exactly
 * that path.
 */
export function activeLinkFor(links: AdminNavLink[], pathname: string | null): AdminNavLink | null {
  const clean = (pathname ?? "").replace(/\/$/, "");
  const root = "/admin/dashboard";

  return (
    links
      .filter((link) => {
        const href = link.href.replace(/\/$/, "");
        if (href === root) return clean === root;
        return clean === href || clean.startsWith(href + "/");
      })
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}
