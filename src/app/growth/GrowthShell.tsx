"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgePercent,
  Banknote,
  Building2,
  Contact,
  Handshake,
  Image as ImageIcon,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Megaphone,
  Menu,
  Stamp,
  TrendingUp,
  X,
} from "lucide-react";
import SessionGuard, { useSessionGuard } from "@/components/admin/SessionGuard";
import { signOut as signOutAction } from "../admin/actions";
import {
  GROWTH_STAGE_LABELS,
  ROLE_LABELS,
  type ConsoleUser,
  type Permission,
} from "@/lib/auth/permissions";

/**
 * The frame around every Growth workspace screen.
 *
 * Every navigation item declares the permission it needs and is dropped
 * when the person does not hold it, rather than being rendered and then
 * failing when clicked. A menu that shows you doors you cannot open is a
 * worse experience than a smaller menu, and it also leaks the shape of
 * what other people can do.
 */

interface NavLink {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  permission: Permission;
}

const NAV_GROUPS: { id: string; label: string | null; links: NavLink[] }[] = [
  {
    id: "main",
    label: null,
    links: [
      {
        id: "overview",
        label: "Overview",
        href: "/growth",
        icon: LayoutDashboard,
        hint: "Your week",
        permission: "workspace.growth",
      },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    links: [
      {
        id: "contacts",
        label: "Contacts",
        href: "/growth/pipeline",
        icon: Contact,
        hint: "People and stages",
        permission: "crm.contacts.read.own",
      },
      {
        id: "accounts",
        label: "Accounts",
        href: "/growth/accounts",
        icon: Building2,
        hint: "Companies",
        permission: "crm.accounts.manage",
      },
      {
        id: "deals",
        label: "Deals",
        href: "/growth/deals",
        icon: Handshake,
        hint: "What might close",
        permission: "crm.deals.manage",
      },
      {
        id: "registrations",
        label: "Registrations",
        href: "/growth/registrations",
        icon: Stamp,
        hint: "Claim a named account",
        permission: "crm.registrations.file",
      },
    ],
  },
  {
    id: "acquisition",
    label: "Acquisition",
    links: [
      {
        id: "campaigns",
        label: "Campaigns",
        href: "/growth/campaigns",
        icon: Megaphone,
        hint: "Landing pages",
        permission: "campaigns.manage",
      },
      {
        id: "links",
        label: "Tracked links",
        href: "/growth/links",
        icon: LinkIcon,
        hint: "Your attribution links",
        permission: "links.manage",
      },
      {
        id: "promotions",
        label: "Promo codes",
        href: "/growth/promotions",
        icon: BadgePercent,
        hint: "Your codes",
        permission: "promotions.manage",
      },
      {
        id: "social",
        label: "Social Studio",
        href: "/growth/social",
        icon: ImageIcon,
        hint: "Posts and cards",
        permission: "social.manage",
      },
    ],
  },
  {
    id: "numbers",
    label: "Numbers",
    links: [
      {
        id: "earnings",
        label: "Earnings",
        href: "/growth/earnings",
        icon: Banknote,
        hint: "What you have earned",
        permission: "commission.read.own",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/growth/analytics",
        icon: TrendingUp,
        hint: "Traffic and funnel",
        permission: "analytics.read",
      },
    ],
  },
];

function isLinkActive(href: string, pathname: string | null) {
  const cleanPath = pathname ? pathname.replace(/\/$/, "") : "";
  const cleanHref = href.replace(/\/$/, "");
  if (cleanHref === "/growth") return cleanPath === "/growth";
  return cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
}

export default function GrowthShell({
  user,
  permissions,
  children,
}: {
  user: ConsoleUser;
  permissions: Permission[];
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <GrowthChrome user={user} permissions={permissions}>
        {children}
      </GrowthChrome>
    </SessionGuard>
  );
}

function GrowthChrome({
  user,
  permissions,
  children,
}: {
  user: ConsoleUser;
  permissions: Permission[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { markSigningOut } = useSessionGuard();

  const held = new Set(permissions);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => held.has(link.permission)),
  })).filter((group) => group.links.length > 0);

  const allLinks = groups.flatMap((group) => group.links);
  const activeLink = allLinks.find((link) => isLinkActive(link.href, pathname));

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Body scroll lock while the drawer is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    markSigningOut();
    const result = await signOutAction();
    if (!result.error) {
      router.push("/admin");
      router.refresh();
    }
  };

  const stageLabel = user.growthStage
    ? GROWTH_STAGE_LABELS[user.growthStage]
    : ROLE_LABELS[user.role];

  const navList = (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1.5">
          {group.label && (
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 px-3 mb-0.5">
              {group.label}
            </span>
          )}
          {group.links.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.href, pathname);
            return (
              <Link
                key={link.id}
                href={link.href}
                title={link.hint}
                className={`flex items-center gap-2.5 px-3 py-2 min-h-11 md:min-h-0 rounded-full text-[11px] font-semibold select-none border transition-colors duration-200 ${
                  active
                    ? "bg-white text-black font-bold border-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col md:flex-row relative">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-black/70 backdrop-blur-xl border-b border-white/5 pl-4 pr-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
            ABRAM Growth
          </span>
          <span className="block text-sm font-bold tracking-tight text-white truncate">
            {activeLink?.label || "Overview"}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-zinc-300 hover:text-white active:bg-white/[0.08] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[204px] xl:w-56 border-r border-white/5 bg-zinc-950/40 flex-col h-screen sticky top-0 justify-between shrink-0 px-3 py-5">
        <div className="space-y-5 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5 px-2 pb-4 border-b border-white/5">
            <span className="font-bold tracking-tight text-white text-[13px] leading-snug">
              ABRAM Growth
            </span>
            <span className="text-[9px] bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono w-max">
              {stageLabel.toUpperCase()}
            </span>
          </div>
          {navList}
        </div>

        <div className="pt-4 border-t border-white/5 px-2 space-y-2">
          <p className="text-[10px] text-zinc-500 truncate" title={user.email}>
            {user.fullName || user.email}
          </p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-zinc-950 border-l border-white/5 flex flex-col px-3 py-5 overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-4 mb-4 border-b border-white/5">
              <span className="font-bold tracking-tight text-white text-[13px]">ABRAM Growth</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-11 h-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {navList}

            <div className="mt-auto pt-4 border-t border-white/5 px-2 space-y-2">
              <p className="text-[10px] text-zinc-500 truncate">{user.fullName || user.email}</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-zinc-300 min-h-11"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-16 md:pt-0">{children}</main>
    </div>
  );
}
