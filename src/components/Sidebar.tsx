"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import pagesData from "../utils/navigation-data.json";

interface NavItem {
  slug: string[];
  path: string;
  title: string;
  group: string;
  groupIcon: string;
  product: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSearchClick: () => void;
}

// Convert kebab-case to PascalCase
const kebabToPascal = (str: string) => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

// Render dynamic icon component
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const pascalName = kebabToPascal(name);
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[pascalName] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export default function Sidebar({ sidebarOpen, setSidebarOpen, onSearchClick }: SidebarProps) {
  const pathname = usePathname();

  // Group items by "group", preserving the original ordering
  const groupedSections = useMemo(() => {
    const grouped: { groupName: string; groupIcon: string; items: NavItem[] }[] = [];
    (pagesData as NavItem[]).forEach((item) => {
      let section = grouped.find((g) => g.groupName === item.group);
      if (!section) {
        section = {
          groupName: item.group,
          groupIcon: item.groupIcon,
          items: [],
        };
        grouped.push(section);
      }
      section.items.push(item);
    });
    return grouped;
  }, []);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Auto-expand section containing current active path on mount and path changes
  useEffect(() => {
    groupedSections.forEach((section) => {
      const hasActiveChild = section.items.some((item) => {
        const itemHref = item.path === "" ? "/docs" : `/docs/${item.path}`;
        return itemHref === pathname;
      });
      if (hasActiveChild) {
        setExpandedSections((prev) => ({ ...prev, [section.groupName]: true }));
      }
    });
  }, [pathname, groupedSections]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const toggleSection = (groupName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `group flex items-center justify-between rounded-md px-3 py-3.5 lg:py-1.5 text-xs transition-all duration-200 ${
      isActive
        ? "bg-zinc-900 text-white font-medium"
        : "text-zinc-400 font-medium hover:text-zinc-100"
    }`;
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-zinc-900 bg-black pt-20 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:pt-0 lg:z-0 lg:bg-transparent lg:backdrop-blur-none lg:border-r-0 lg:overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-lenis-prevent
      >
        <div className="flex h-full flex-col px-4 pb-6 overflow-y-auto" data-lenis-prevent>
          {/* Mobile close button */}
          <div className="flex items-center justify-end pt-2 pb-1 lg:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="h-11 w-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              aria-label="Close menu"
            >
              <LucideIcons.X className="h-5 w-5" />
            </button>
          </div>
        {/* Sidebar Search Bar Trigger */}
        <div className="mb-4 pt-1 shrink-0">
          <button
            onClick={onSearchClick}
            className="relative w-full flex items-center justify-between gap-2 text-left cursor-pointer group rounded-lg border border-zinc-900 bg-zinc-950/40 py-2 pl-3.5 pr-2.5 text-xs text-zinc-400 hover:text-zinc-300 hover:border-zinc-800 hover:bg-zinc-950 transition-all duration-200 select-none"
          >
            <div className="flex items-center gap-2">
              <LucideIcons.Search className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
              <span>Search...</span>
            </div>
            <kbd className="inline-flex items-center rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-sans text-[9px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile Global Navigation Links (< sm) */}
        <div className="sm:hidden mb-4 shrink-0">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Navigation
          </div>
          <div className="mt-1.5 space-y-1">
            {[
              { label: "Home", href: "/" },
              { label: "Docs", href: "/docs" },
              { label: "Pricing", href: "/pricing" },
            ].map((link) => {
              const isActive = link.href === "/" 
                ? pathname === "/" 
                : pathname.startsWith(link.href);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex h-11 items-center rounded-lg px-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {/* Subtle separator line */}
          <div className="border-b border-white/5 my-4" />
        </div>

        <nav className="flex-1 space-y-4 py-2">
          {groupedSections.map((section) => {
            const isExpanded = !!expandedSections[section.groupName];
            const hasActiveChild = section.items.some((item) => {
              const itemHref = item.path === "" ? "/docs" : `/docs/${item.path}`;
              return itemHref === pathname;
            });

            return (
              <div key={section.groupName} className="space-y-1">
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.groupName)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-3.5 lg:py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-white/5 cursor-pointer ${
                    hasActiveChild ? "text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={hasActiveChild ? "text-zinc-200" : "text-zinc-500"}>
                      <DynamicIcon name={section.groupIcon} className="h-4 w-4" />
                    </span>
                    <span className="capitalize">{section.groupName}</span>
                  </div>
                  <span>
                    {isExpanded ? (
                      <LucideIcons.ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                    ) : (
                      <LucideIcons.ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                    )}
                  </span>
                </button>

                {/* Section Items */}
                <div
                  className={`space-y-0.5 pl-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  {section.items.map((item) => {
                    const itemHref = item.path === "" ? "/docs" : `/docs/${item.path}`;
                    return (
                      <Link
                        key={itemHref}
                        href={itemHref}
                        onClick={() => setSidebarOpen(false)}
                        className={getLinkClass(itemHref)}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="border-t border-zinc-900 pt-4 mt-auto">
          <div className="rounded-lg bg-zinc-950 border border-zinc-900 p-3 flex items-start gap-2.5">
            <LucideIcons.ShieldAlert className="h-4 w-4 text-abram-info/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-zinc-400">System Status</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">All services operational</p>
            </div>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
