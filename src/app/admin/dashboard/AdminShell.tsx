"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signOut as signOutAction } from "../actions";
import SessionGuard, { useSessionGuard } from "@/components/admin/SessionGuard";
import CommandPalette, { openCommandPalette } from "@/components/admin/CommandPalette";
import type { ConsoleUser, Permission } from "@/lib/auth/permissions";
import { activeLinkFor, visibleGroups } from "./nav";
import { ChevronRight, LogOut, Menu, Search, User, X } from "lucide-react";

/**
 * The chrome around every console screen.
 *
 * The navigation itself moved to `nav.ts`, so the sidebar, the mobile
 * sheet and the ⌘K palette all read one list and cannot drift. What is
 * left here is the frame: the mark, the six groups, who is signed in, and
 * the way out.
 */

export default function AdminShell({
  user,
  permissions,
  taskCount = 0,
  children,
}: {
  user: ConsoleUser;
  permissions: Permission[];
  /** Open follow ups due by the end of today. Drawn beside the Tasks link. */
  taskCount?: number;
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <DashboardChrome user={user} permissions={permissions} taskCount={taskCount}>
        {children}
      </DashboardChrome>
    </SessionGuard>
  );
}

/**
 * The mark, top left, linking home.
 *
 * The lockup the marketing site uses, on its dark background, because a
 * console that looks like a different product from the site it
 * administers is a console people hesitate in.
 */
function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/admin/dashboard"
      aria-label="ABRAM admin, overview"
      className={`inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-80 ${className}`}
    >
      <Image
        src="/abram-logo-lockup-cream.png"
        alt="ABRAM"
        width={96}
        height={19}
        priority
        className="h-[18px] w-auto select-none"
      />
    </Link>
  );
}

function DashboardChrome({
  user,
  permissions,
  taskCount,
  children,
}: {
  user: ConsoleUser;
  permissions: Permission[];
  taskCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Drawn from what this person holds, not from the full catalog.
  const groups = visibleGroups(permissions);
  const links = groups.flatMap((group) => group.links);
  const activeLink = activeLinkFor(links, pathname);
  const activeHref = activeLink?.href ?? null;

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(
    user.fullName || user.email || "ABRAM Team"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { markSigningOut } = useSessionGuard();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user?.email) setCurrentUserEmail(data.user.email);
      })
      .catch(() => {
        // The name passed in from the server is already a correct answer.
      });
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

  const handleSignOut = async () => {
    markSigningOut();
    const result = await signOutAction();
    if (!result.error) {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col md:flex-row relative">
      <CommandPalette permissions={permissions} />

      {/* Mobile Top Header — shows where you are, not every place you could go */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-black/70 backdrop-blur-xl border-b border-white/5 pl-4 pr-2 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <BrandMark className="shrink-0" />
          <span className="block text-sm font-medium tracking-tight text-white truncate">
            {activeLink?.label || "Overview"}
          </span>
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={openCommandPalette}
            aria-label="Search the console"
            className="w-11 h-11 flex items-center justify-center rounded-full text-zinc-300 hover:text-white active:bg-white/[0.08] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="w-11 h-11 flex items-center justify-center rounded-full text-zinc-300 hover:text-white active:bg-white/[0.08] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Left Navigation Sidebar (Desktop) */}
      <aside className="hidden md:flex w-[204px] xl:w-56 border-r border-white/5 bg-zinc-950/40 flex-col h-screen sticky top-0 justify-between shrink-0 px-3 py-5">
        <div className="space-y-4 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-3 px-2 pb-4 border-b border-white/5">
            <BrandMark />
            <button
              type="button"
              onClick={openCommandPalette}
              className="flex items-center gap-2 h-9 px-3 rounded-full border border-white/8 bg-white/[0.02] text-[11px] text-zinc-400 hover:text-white hover:border-white/15 transition-colors"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Search</span>
              <kbd className="ml-auto text-[10px] text-zinc-400 tracking-wider">⌘K</kbd>
            </button>
          </div>

          <nav className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1.5">
                {group.label && (
                  <span className="text-xs uppercase font-bold tracking-widest text-gray-400 px-3 mb-0.5">
                    {group.label}
                  </span>
                )}
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.href === activeHref;
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      // The transparent border keeps active and inactive rows
                      // the same height, so selecting one does not nudge the list.
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-[11px] font-medium select-none border transition-colors duration-200 ${
                        isActive
                          ? "bg-white text-black border-white"
                          : "border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.label}</span>
                      {link.countsTasks && taskCount > 0 && (
                        <span
                          className={`ml-auto shrink-0 rounded-full px-1.5 text-[10px] tabular-nums ${
                            isActive ? "bg-black/10 text-black/70" : "bg-white/[0.06] text-zinc-200"
                          }`}
                        >
                          {taskCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2 px-2 text-zinc-400 text-[11px] min-w-0">
            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate" title={currentUserEmail}>
              {currentUserEmail}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-glass flex items-center justify-center gap-2 px-3 h-9 text-[11px] font-medium rounded-full w-full"
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
                <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
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
              {groups.map((group) => (
                <div key={group.id} className="mb-2">
                  {group.label && (
                    <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 px-3 pt-4 pb-2">
                      {group.label}
                    </span>
                  )}
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = link.href === activeHref;
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
                              : "bg-white/[0.03] text-zinc-300 border-white/8"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate text-white">
                            {link.label}
                          </span>
                          <span className="block text-[11px] text-zinc-400 truncate">{link.hint}</span>
                        </span>
                        {link.countsTasks && taskCount > 0 && (
                          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] tabular-nums text-zinc-200">
                            {taskCount}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="shrink-0 border-t border-white/5 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs min-w-0">
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="truncate">{currentUserEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-glass flex items-center justify-center gap-2 px-4 h-9 text-xs font-medium rounded-full shrink-0"
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
