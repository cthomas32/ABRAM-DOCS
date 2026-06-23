"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, PanelLeft, Search, X, ChevronDown, LayoutGrid, Calendar, ClipboardList, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Navbar({ onSearchClick, onMenuClick, mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const isMarketingPage = pathname === "/" || pathname === "/landing";
  const [isVisible, setIsVisible] = useState(!isMarketingPage);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMarketingPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const heroThreshold = window.innerHeight - 80;
      if (window.scrollY >= heroThreshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMarketingPage]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 w-full flex items-center bg-black/50 backdrop-blur-[20px] border-b border-white/8 transition-all duration-500 ease-in-out ${
        isVisible 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Logo & Mobile Sidebar Trigger */}
        <div className="flex items-center gap-4">
          {onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="lg:hidden h-11 w-11 flex items-center justify-center -ml-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden h-11 w-11 flex items-center justify-center -ml-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
          <Link 
            href="/" 
            className="flex h-11 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 rounded-md ml-1 sm:ml-0"
          >
            <Image
              src="/abram-logo-lockup-cream.png"
              alt="ABRAM"
              width={110}
              height={22}
              priority
              className="h-5.5 w-auto block select-none"
            />
          </Link>
        </div>

        {/* Right Section: External App Button & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-4">
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/film-production"
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex items-center gap-1 border border-transparent ${
                pathname.startsWith("/film-production")
                  ? "bg-white/10 text-white border-white/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              Film Production
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </Link>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-white/8 bg-zinc-950/95 backdrop-blur-[20px] p-2 shadow-2xl flex flex-col gap-1 z-50 pointer-events-auto"
                >
                  <Link
                    href="/film-production"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Overview Hub</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Suite control cockpit & breakdowns</p>
                    </div>
                  </Link>

                  <Link
                    href="/film-production/script-breakdown"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Script Breakdown</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">AI screenplay parser & element mapping</p>
                    </div>
                  </Link>

                  <Link
                    href="/film-production/scheduling-budgeting"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Scheduling & Budgeting</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Timeline board & daily burn rates</p>
                    </div>
                  </Link>

                  <Link
                    href="/film-production/call-sheets"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <ClipboardList className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Digital Call Sheets</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Daily schedule, weather & crew call times</p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            href="/production-brain"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname === "/production-brain"
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Brain
          </Link>
          <Link
            href="/docs"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname.startsWith("/docs")
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Learn
          </Link>
          <Link
            href="/blog"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname.startsWith("/blog")
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Blog
          </Link>
          <Link
            href="/pricing"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname === "/pricing"
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Pricing
          </Link>
          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-zinc-200 transition-all duration-200 shadow-md shadow-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Get Started
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>

    </header>
  );
}
