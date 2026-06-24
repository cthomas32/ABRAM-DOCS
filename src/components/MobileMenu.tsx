"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

export default function MobileMenu({ isOpen, onClose, pathname }: MobileMenuProps) {
  // Manage open dropdowns by name/ID
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Automatically open the appropriate sub-menu if pathname starts with it
  useEffect(() => {
    if (isOpen) {
      if (pathname.startsWith("/film-production")) {
        setOpenDropdown("Film Production");
      } else if (pathname.startsWith("/agency")) {
        setOpenDropdown("Creative Ops");
      } else if (pathname.startsWith("/intelligence")) {
        setOpenDropdown("Intelligence");
      } else {
        setOpenDropdown(null);
      }
    }
  }, [isOpen, pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const panelVariants: Variants = {
    closed: {
      y: "-100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      },
    },
    open: {
      y: 0,
      transition: {
        type: "tween",
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const menuLinks = [
    { name: "Home", href: "/", title: "ABRAM Network Home" },
    { 
      name: "Film Production", 
      href: "/film-production",
      isDropdown: true,
      title: "Film Production Suite",
      submenu: [
        { name: "Overview Hub", href: "/film-production", desc: "Suite control cockpit & breakdowns", title: "Film Production Overview Hub" },
        { name: "Script Breakdown", href: "/film-production/script-breakdown", desc: "AI screenplay parser & element mapping", title: "AI Script Breakdown & Screenplay Parser" },
        { name: "Scheduling & Budgeting", href: "/film-production/scheduling-budgeting", desc: "Timeline board & daily burn rates", title: "Film Production Scheduling & Budgeting" },
        { name: "Digital Call Sheets", href: "/film-production/call-sheets", desc: "Daily schedule, weather & crew call times", title: "Digital Call Sheets & Crew Call Times" },
      ]
    },
    {
      name: "Creative Ops",
      href: "/agency",
      isDropdown: true,
      title: "Creative Agency Operations Suite",
      submenu: [
        { name: "Overview Hub", href: "/agency", desc: "Suite control cockpit & client dashboard", title: "Creative Operations Overview Hub" },
        { name: "Client Intake", href: "/agency/client-intake", desc: "Intake forms, briefs & requirements", title: "Client Intake Briefs & Requirements" },
        { name: "Crew Roster", href: "/agency/crew-roster", desc: "Contractor directory & availability", title: "Crew Roster & Contractor Availability" },
        { name: "Smart Scheduling", href: "/agency/smart-scheduling", desc: "AI-driven matching & booking board", title: "AI Smart Scheduling & Crew Booking" },
      ]
    },
    {
      name: "Intelligence",
      href: "/intelligence",
      isDropdown: true,
      title: "Creative Intelligence Suite",
      submenu: [
        { name: "ABRAM", href: "/intelligence/creative-copilot", desc: "Central conversational agent & workspace co-pilot", title: "ABRAM Core AI Workspace Co-Pilot" },
        { name: "ROI Engine", href: "/intelligence", desc: "ROI calculator & yield overview", title: "ROI Yield Engine Calculator" },
        { name: "Production Brain", href: "/intelligence/brain", desc: "Workspace memory & search", title: "Production Brain Workspace Memory & Search" },
        { name: "Brief Intelligence", href: "/intelligence/brief-intelligence", desc: "AI brief intelligence & scoping", title: "Brief Intelligence Blueprints & Scoping" },
        { name: "Crew Matchmaking", href: "/intelligence/crew-matchmaking", desc: "100-pt crew suitability index", title: "Crew Suitability Matchmaking Index" },
      ]
    },
    { name: "Subscribe to ABRAM Intelligence", href: "/blog", title: "Subscribe to ABRAM Intelligence" },
    { name: "Pricing", href: "/pricing", title: "ABRAM Platform Pricing Plans" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-hidden pointer-events-none flex flex-col justify-start sm:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Slide-down Panel */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
            className="relative w-full bg-zinc-950/98 backdrop-blur-[32px] border-b border-white/8 shadow-2xl pointer-events-auto flex flex-col px-6 py-8 md:px-8 max-h-full overflow-y-auto"
          >
            <div className="w-full max-w-md mx-auto">
              <nav className="flex flex-col gap-2.5">
                {menuLinks.map((link) => {
                  if (link.isDropdown && link.submenu) {
                    const isParentActive = pathname.startsWith(link.href);
                    const isCurrentDropdownOpen = openDropdown === link.name;
                    return (
                      <motion.div key={link.name} variants={itemVariants} className="flex flex-col">
                        <button
                          onClick={() => toggleDropdown(link.name)}
                          className={`flex items-center justify-between w-full min-h-[44px] rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer text-left ${
                            isParentActive
                              ? "bg-white/5 border-white/10 text-white shadow-md shadow-white/5"
                              : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02] hover:border-white/5"
                          }`}
                        >
                          <span className="font-sans">{link.name}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCurrentDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isCurrentDropdownOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden pl-4 pr-1 flex flex-col gap-1.5 mt-1.5 border-l border-white/5 ml-4"
                            >
                              {link.submenu.map((sublink) => {
                                const isSubActive = pathname === sublink.href;
                                return (
                                  <Link
                                    key={sublink.name}
                                    href={sublink.href}
                                    onClick={onClose}
                                    title={sublink.title}
                                    className={`flex flex-col gap-0.5 rounded-xl border p-3 min-h-[44px] text-left transition-all duration-200 ${
                                      isSubActive
                                        ? "bg-white/5 border-white/10 text-white"
                                        : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.01] hover:border-white/5"
                                    }`}
                                  >
                                    <span className="text-xs font-semibold font-sans text-zinc-200">{sublink.name}</span>
                                    <span className="text-[10px] text-zinc-500 font-sans leading-normal font-light">{sublink.desc}</span>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  const isActive = 
                    link.href === "/" 
                      ? pathname === "/" 
                      : pathname.startsWith(link.href);

                  return (
                    <motion.div key={link.name} variants={itemVariants}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        title={link.title}
                        className={`flex items-center min-h-[44px] rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                          isActive
                            ? "bg-white/5 border-white/10 text-white shadow-md shadow-white/5"
                            : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02] hover:border-white/5"
                        }`}
                      >
                        <span className="font-sans">{link.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Get Started Button (CTA) */}
                <motion.div variants={itemVariants} className="mt-2.5">
                  <a
                    href="https://app.abram.network"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white text-black min-h-[44px] px-4 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200 shadow-md shadow-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
