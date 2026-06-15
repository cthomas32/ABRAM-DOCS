"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Compass, Users, User, ShieldAlert, Building2 } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    icon: <Compass className="h-4 w-4" />,
    items: [
      { title: "Welcome", href: "/docs/introduction" },
      { title: "Order of Operations", href: "/docs/introduction/order-of-operations" },
      { title: "AI Capabilities", href: "/docs/introduction/ai-capabilities" }
    ]
  },
  {
    id: "clients",
    title: "Clients",
    icon: <User className="h-4 w-4" />,
    items: [
      { title: "Client Overview", href: "/docs/clients/overview" },
      { title: "Workspace Setup", href: "/docs/clients/workspaces" },
      { title: "Managing Payments", href: "/docs/clients/payments" }
    ]
  },
  {
    id: "contractors",
    title: "Contractors",
    icon: <Users className="h-4 w-4" />,
    items: [
      { title: "Contractor Overview", href: "/docs/contractors/overview" },
      { title: "Onboarding Flow", href: "/docs/contractors/onboarding" },
      { title: "Stripe & Payouts", href: "/docs/contractors/payouts" }
    ]
  },
  {
    id: "orgs",
    title: "Orgs & Studios",
    icon: <Building2 className="h-4 w-4" />,
    items: [
      { title: "Studio Overview", href: "/docs/orgs/overview" },
      { title: "Organization Setup", href: "/docs/orgs/setup" },
      { title: "Team Management", href: "/docs/orgs/team" },
      { title: "Intake & Scoping", href: "/docs/orgs/scoping" }
    ]
  }
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    introduction: true,
    clients: true,
    contractors: true,
    orgs: true,
  });

  // Auto-expand section containing current active path on mount
  useEffect(() => {
    navigationConfig.forEach((section) => {
      const hasActiveChild = section.items.some((item) => item.href === pathname);
      if (hasActiveChild) {
        setExpandedSections((prev) => ({ ...prev, [section.id]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return `group flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
      isActive
        ? "bg-white/5 text-white border-l-2 border-white pl-2.5"
        : "text-neutral-400 hover:bg-neutral-900/40 hover:text-neutral-200 pl-3"
    }`;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-border bg-neutral-950/80 backdrop-blur-2xl pt-20 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col px-4 pb-6 overflow-y-auto">
        <nav className="flex-1 space-y-4 py-2">
          {navigationConfig.map((section) => {
            const isExpanded = expandedSections[section.id];
            const hasActiveChild = section.items.some((item) => item.href === pathname);

            return (
              <div key={section.id} className="space-y-1">
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-white/5 ${
                    hasActiveChild ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={hasActiveChild ? "text-neutral-200" : "text-neutral-500"}>
                      {section.icon}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  <span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
                    )}
                  </span>
                </button>

                {/* Section Items */}
                <div
                  className={`space-y-0.5 pl-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={linkClass(item.href)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="border-t border-border/60 pt-4 mt-auto">
          <div className="rounded-[10px] bg-neutral-900/50 border border-border/40 p-3 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-abram-info/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">System Status</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">All services operational</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
