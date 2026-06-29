"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signOut as signOutAction } from "../actions";
import { 
  Sparkles, 
  BookOpen, 
  Tag, 
  Users, 
  Mail, 
  LogOut, 
  User, 
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("ABRAM Team");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchUser();
  }, []);

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
    const result = await signOutAction();
    if (!result.error) {
      router.push("/admin");
      router.refresh();
    }
  };

  const navLinks = [
    { id: "overview", label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { id: "docs", label: "Docs Editor", href: "/admin/dashboard/docs", icon: BookOpen },
    { id: "blog", label: "Blog Posts", href: "/admin/dashboard/blog", icon: Sparkles },
    { id: "changelog", label: "Release Notes", href: "/admin/dashboard/changelog", icon: Tag },
    { id: "subscribers", label: "Subscribers", href: "/admin/dashboard/subscribers", icon: Users },
    { id: "broadcasts", label: "Email Broadcasts", href: "/admin/dashboard/broadcasts", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col md:flex-row relative">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 flex items-center justify-between">
        <span className="font-bold tracking-tight text-white text-sm flex items-center gap-2">
          ABRAM Marketing Engine
        </span>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Left Navigation Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 border-r border-white/5 bg-zinc-950/40 flex-col h-screen sticky top-0 justify-between shrink-0 p-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5 pb-4 border-b border-white/5">
            <span className="font-bold tracking-tight text-white text-sm flex items-center gap-2">
              ABRAM Marketing Engine
            </span>
            <span className="text-[9px] bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono w-max">
              ADMIN PANEL
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const cleanPath = pathname ? pathname.replace(/\/$/, "") : "";
              const cleanHref = link.href.replace(/\/$/, "");
              const isActive = cleanHref === "/admin/dashboard"
                ? cleanPath === "/admin/dashboard"
                : cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold select-none transition-all duration-200 ${
                    isActive
                      ? "bg-white text-black font-bold border border-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 text-zinc-400 text-xs truncate">
            <User className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">{currentUserEmail}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-glass flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-full w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/95 pt-20 p-6 flex flex-col justify-between">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const cleanPath = pathname ? pathname.replace(/\/$/, "") : "";
              const cleanHref = link.href.replace(/\/$/, "");
              const isActive = cleanHref === "/admin/dashboard"
                ? cleanPath === "/admin/dashboard"
                : cleanPath === cleanHref || cleanPath.startsWith(cleanHref + "/");
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold select-none transition-all duration-200 ${
                    isActive
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 px-2 text-zinc-400 text-sm">
              <User className="w-5 h-5 text-zinc-500 shrink-0" />
              <span>{currentUserEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-glass flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-full w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
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
