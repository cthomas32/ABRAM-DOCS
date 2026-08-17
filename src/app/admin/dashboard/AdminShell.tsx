"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signOut as signOutAction } from "../actions";
import SessionGuard, { useSessionGuard } from "@/components/admin/SessionGuard";
import type { ConsoleUser, Permission } from "@/lib/auth/permissions";
import {
  Newspaper,
  BookOpen,
  Tag,
  Users,
  Mail,
  LogOut,
  User,
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  BadgePercent,
  Contact,
  Image as ImageIcon,
  Menu,
  X,
  ChevronRight,
  UsersRound,
  KeyRound,
  Banknote,
  Stamp
} from "lucide-react";

/**
 * Every destination declares the permission it needs.
 *
 * The list is filtered before it is rendered, so a link that would be
 * refused is never drawn. That is not only politeness: a menu showing
 * doors somebody cannot open also tells them the shape of what everybody
 * else can do, which is not information a console should volunteer.
 */
interface AdminNavLink {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  permission: Permission;
}

const NAV_GROUPS: { id: string; label: string | null; links: AdminNavLink[] }[] = [
  {
    id: "main",
    label: null as string | null,
    links: [
      { id: "overview", label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, hint: "Marketing telemetry" , permission: "console.admin" },
    ],
  },
  {
    id: "content",
    label: "Content",
    links: [
      { id: "docs", label: "Docs Editor", href: "/admin/dashboard/docs", icon: BookOpen, hint: "Help centre guides" , permission: "content.docs" },
      { id: "blog", label: "Blog Posts", href: "/admin/dashboard/blog", icon: Newspaper, hint: "Articles & announcements" , permission: "content.blog" },
      { id: "changelog", label: "Release Notes", href: "/admin/dashboard/changelog", icon: Tag, hint: "Version changelogs" , permission: "content.changelog" },
      { id: "social", label: "Social Studio", href: "/admin/dashboard/social", icon: ImageIcon, hint: "Post images & carousels" , permission: "social.manage" },
      { id: "team", label: "Team", href: "/admin/dashboard/team", icon: UsersRound, hint: "People & bylines" , permission: "content.team" },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    links: [
      { id: "crm", label: "Contacts", href: "/admin/dashboard/crm", icon: Contact, hint: "Pipeline & accounts", permission: "crm.contacts.read.own" },
      { id: "registrations", label: "Registrations", href: "/admin/dashboard/registrations", icon: Stamp, hint: "Claim a named account", permission: "crm.registrations.file" },
      { id: "campaigns", label: "Campaign Pages", href: "/admin/dashboard/campaigns", icon: Megaphone, hint: "Landing page funnels" , permission: "campaigns.manage" },
      { id: "links", label: "Link Hub", href: "/admin/dashboard/links", icon: LinkIcon, hint: "Your one bio link" , permission: "links.manage" },
      { id: "promotions", label: "Promotions", href: "/admin/dashboard/promotions", icon: BadgePercent, hint: "Discount codes" , permission: "promotions.manage" },
      { id: "subscribers", label: "Subscribers", href: "/admin/dashboard/subscribers", icon: Users, hint: "Newsletter contacts" , permission: "subscribers.read" },
      { id: "broadcasts", label: "Email Broadcasts", href: "/admin/dashboard/broadcasts", icon: Mail, hint: "Compose & send", permission: "broadcasts.draft" },
    ],
  },
  {
    id: "numbers",
    label: "Numbers",
    links: [
      { id: "earnings", label: "Your Earnings", href: "/admin/dashboard/earnings", icon: Banknote, hint: "Commission statement", permission: "commission.read.own" },
    ],
  },
  {
    id: "company",
    label: "Company",
    links: [
      { id: "people", label: "People & Access", href: "/admin/dashboard/people", icon: KeyRound, hint: "Logins and roles", permission: "roles.manage" },
      { id: "revenue", label: "Revenue & Commission", href: "/admin/dashboard/revenue", icon: Banknote, hint: "Collections and payouts", permission: "commission.manage" },
    ],
  },
];



function isLinkActive(href: string, pathname: string | null) {
  const cleanPath = pathname ? pathname.replace(/\/$/, "") : "";
  const cleanHref = href.replace(/\/$/, "");
  if (cleanHref === "/admin/dashboard") return cleanPath === "/admin/dashboard";
  return cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
}

export default function AdminShell({
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
      <DashboardChrome user={user} permissions={permissions}>
        {children}
      </DashboardChrome>
    </SessionGuard>
  );
}

function DashboardChrome({
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

  // Drawn from what this person holds, not from the full catalog.
  const held = new Set(permissions);
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => held.has(link.permission)),
  })).filter((group) => group.links.length > 0);
  const visibleLinks = visibleGroups.flatMap((group) => group.links);

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(
    user.fullName || user.email || "ABRAM Team"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { markSigningOut } = useSessionGuard();
  const supabase = createClient();

  useEffect(() => {
    fetchUser();
  }, []);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    } catch (err) {
      console.error("Error fetching user session:", err);
    }
  };

  const handleSignOut = async () => {
    markSigningOut();
    const result = await signOutAction();
    if (!result.error) {
      router.push("/admin");
      router.refresh();
    }
  };

  // The label of the section currently open, shown in the mobile header
  const activeLink = visibleLinks.find((link) => isLinkActive(link.href, pathname));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col md:flex-row relative">
      {/* Mobile Top Header — shows where you are, not every place you could go */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-black/70 backdrop-blur-xl border-b border-white/5 pl-4 pr-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
            ABRAM Admin
          </span>
          <span className="block text-sm font-bold tracking-tight text-white truncate">
            {activeLink?.label || "Dashboard"}
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

      {/* Left Navigation Sidebar (Desktop) */}
      <aside className="hidden md:flex w-[204px] xl:w-56 border-r border-white/5 bg-zinc-950/40 flex-col h-screen sticky top-0 justify-between shrink-0 px-3 py-5">
        <div className="space-y-5 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5 px-2 pb-4 border-b border-white/5">
            <span className="font-bold tracking-tight text-white text-[13px] leading-snug">
              ABRAM Marketing Engine
            </span>
            <span className="text-[9px] bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono w-max">
              ADMIN PANEL
            </span>
          </div>

          <nav className="flex flex-col gap-4">
            {visibleGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1.5">
                {group.label && (
                  <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 px-3 mb-0.5">
                    {group.label}
                  </span>
                )}
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href, pathname);
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      // The transparent border keeps active and inactive rows
                      // the same height, so selecting one does not nudge the list.
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-[11px] font-semibold select-none border transition-colors duration-200 ${
                        isActive
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
        </div>

        <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 px-2 text-zinc-400 text-[11px] min-w-0">
            <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate" title={currentUserEmail}>
              {currentUserEmail}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-glass flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-full w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Sheet — full-screen list, one tap per destination */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col">
          <div
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative mt-auto max-h-[92vh] flex flex-col bg-[#0C0C0C] border-t border-white/10 rounded-t-3xl shadow-2xl">
            {/* Grab handle + close */}
            <div className="shrink-0 px-5 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
                  Go to
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white active:bg-white/[0.08] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
              {visibleGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  {group.label && (
                    <span className="block text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 px-3 pt-4 pb-2">
                      {group.label}
                    </span>
                  )}
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.href, pathname);
                    return (
                      <Link
                        key={link.id}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-3 py-3 rounded-2xl min-h-[56px] transition-colors ${
                          isActive ? "bg-white/[0.06]" : "active:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isActive
                              ? "bg-white text-black border-white"
                              : "bg-white/[0.03] text-zinc-400 border-white/8"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold truncate ${isActive ? "text-white" : "text-zinc-200"}`}>
                            {link.label}
                          </span>
                          <span className="block text-[11px] text-zinc-500 truncate">{link.hint}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="shrink-0 border-t border-white/5 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs min-w-0">
                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">{currentUserEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-glass flex items-center justify-center gap-2 px-4 h-10 text-xs font-semibold rounded-full shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 flex flex-col h-auto md:h-screen md:overflow-hidden">
        {children}
      </main>
    </div>
  );
}
