/**
 * Where you can go, in six groups.
 *
 * There were twenty destinations in five groups named Content, Audience,
 * Numbers and Company, and the founder's complaint about it was exact:
 * "there are a TON of pages now, it's getting confusing". The count was
 * not really the problem. The grouping was — "Audience" held the deal
 * board, the promo codes and the newsletter, which are three different
 * jobs done by three different people on three different days.
 *
 * So the groups are now named after the job rather than after an
 * abstraction:
 *
 *   (no label)  Overview. One row, always first.
 *   CRM         Anything that is a person, a company, money in progress,
 *               or a promise to follow one of them up.
 *   Marketing   Anything that goes out: a page, an email, a code, a post.
 *   Content     Anything that stays up: docs, blog, release notes.
 *   Money       What has been earned and what has been collected.
 *   Team        Who works here and what their login can do.
 *
 * Two things did not become new rows and deliberately so. The deal board
 * is a second view of the deal list, not a second list, so it lives
 * behind a view toggle on the deals screen and keeps its URL. Events,
 * capture codes and the card are already tabs inside the people screen.
 *
 * Every entry declares the permission it needs, and the list is filtered
 * before it is drawn. That is not only politeness: a menu showing doors
 * somebody cannot open also tells them the shape of what everybody else
 * can do, which is not information a console should volunteer.
 *
 * The command palette reads this same list, so a destination added here
 * is searchable the moment it is navigable, and the two can never
 * disagree about what exists.
 */

import {
  Banknote,
  BadgePercent,
  BookOpen,
  Building2,
  CheckSquare,
  Contact,
  Handshake,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  Megaphone,
  Newspaper,
  Stamp,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";
import type React from "react";
import type { Permission } from "@/lib/auth/permissions";

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
    id: "overview",
    label: null,
    links: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        hint: "Traffic, signups and what moved this week",
        permission: "console.admin",
        keywords: ["home", "dashboard", "analytics", "telemetry"],
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    links: [
      {
        id: "contacts",
        label: "People",
        href: "/admin/dashboard/crm",
        icon: Contact,
        hint: "Every person, wherever they came from",
        permission: "crm.contacts.read.own",
        keywords: ["contacts", "pipeline", "leads", "events", "codes", "card"],
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
        hint: "What is open, and the board it moves on",
        permission: "crm.deals.manage",
        keywords: ["board", "kanban", "pipeline", "stages", "forecast"],
      },
      {
        id: "tasks",
        label: "Tasks",
        href: "/admin/dashboard/tasks",
        icon: CheckSquare,
        hint: "Follow ups due",
        permission: "crm.contacts.read.own",
        keywords: ["follow up", "queue", "overdue", "reminders"],
        countsTasks: true,
      },
      {
        id: "registrations",
        label: "Registrations",
        href: "/admin/dashboard/registrations",
        icon: Stamp,
        hint: "Claim a named account",
        permission: "crm.registrations.file",
        keywords: ["deal registration", "claim", "attribution"],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    links: [
      {
        id: "campaigns",
        label: "Campaign Pages",
        href: "/admin/dashboard/campaigns",
        icon: Megaphone,
        hint: "Landing page funnels",
        permission: "campaigns.manage",
        keywords: ["landing", "funnel", "utm"],
      },
      {
        id: "broadcasts",
        label: "Email",
        href: "/admin/dashboard/broadcasts",
        icon: Mail,
        hint: "Compose and send a broadcast",
        permission: "broadcasts.draft",
        keywords: ["broadcast", "newsletter", "send", "resend"],
      },
      {
        id: "subscribers",
        label: "Subscribers",
        href: "/admin/dashboard/subscribers",
        icon: Users,
        hint: "The mailing list, and who is on it",
        permission: "subscribers.read",
        keywords: ["newsletter", "mailing list", "audience"],
      },
      {
        id: "promotions",
        label: "Promo Codes",
        href: "/admin/dashboard/promotions",
        icon: BadgePercent,
        hint: "Discounts, and what they attributed",
        permission: "promotions.manage",
        keywords: ["discount", "coupon", "stripe"],
      },
      {
        id: "links",
        label: "Link Hub",
        href: "/admin/dashboard/links",
        icon: LinkIcon,
        hint: "Your one bio link",
        permission: "links.manage",
        keywords: ["bio", "linktree", "shortlink"],
      },
      {
        id: "social",
        label: "Social Studio",
        href: "/admin/dashboard/social",
        icon: ImageIcon,
        hint: "Post images and carousels",
        permission: "social.manage",
        keywords: ["instagram", "linkedin", "carousel", "calendar"],
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    links: [
      {
        id: "blog",
        label: "Blog",
        href: "/admin/dashboard/blog",
        icon: Newspaper,
        hint: "Articles and announcements",
        permission: "content.blog",
        keywords: ["posts", "articles", "writing"],
      },
      {
        id: "docs",
        label: "Docs",
        href: "/admin/dashboard/docs",
        icon: BookOpen,
        hint: "Help centre guides",
        permission: "content.docs",
        keywords: ["help", "guides", "user guide"],
      },
      {
        id: "changelog",
        label: "Release Notes",
        href: "/admin/dashboard/changelog",
        icon: Tag,
        hint: "Version changelogs",
        permission: "content.changelog",
        keywords: ["changelog", "versions", "shipped"],
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    links: [
      {
        id: "earnings",
        label: "Your Earnings",
        href: "/admin/dashboard/earnings",
        icon: Banknote,
        hint: "Your commission statement",
        permission: "commission.read.own",
        keywords: ["commission", "payout", "statement"],
      },
      {
        id: "revenue",
        label: "Revenue",
        href: "/admin/dashboard/revenue",
        icon: Banknote,
        hint: "Collections and payout runs",
        permission: "commission.manage",
        keywords: ["collections", "payouts", "ledger"],
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    links: [
      {
        id: "team",
        label: "Team & Bylines",
        href: "/admin/dashboard/team",
        icon: UsersRound,
        hint: "Who is on the site, and how they are credited",
        permission: "content.team",
        keywords: ["authors", "bio", "staff"],
      },
      {
        id: "people",
        label: "People & Access",
        href: "/admin/dashboard/people",
        icon: KeyRound,
        hint: "Logins, roles and commission terms",
        permission: "roles.manage",
        keywords: ["roles", "permissions", "invite", "admin users"],
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
