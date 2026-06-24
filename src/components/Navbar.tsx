"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, PanelLeft, Search, X, ChevronDown, LayoutGrid, Calendar, ClipboardList, Sparkles, Users, FileText, Brain, Coins } from "lucide-react";
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
  const [filmDropdownOpen, setFilmDropdownOpen] = useState(false);
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);
  const [intelligenceDropdownOpen, setIntelligenceDropdownOpen] = useState(false);
  const filmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const agencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intelligenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFilmMouseEnter = () => {
    if (filmTimeoutRef.current) clearTimeout(filmTimeoutRef.current);
    setFilmDropdownOpen(true);
  };

  const handleFilmMouseLeave = () => {
    filmTimeoutRef.current = setTimeout(() => {
      setFilmDropdownOpen(false);
    }, 150);
  };

  const handleAgencyMouseEnter = () => {
    if (agencyTimeoutRef.current) clearTimeout(agencyTimeoutRef.current);
    setAgencyDropdownOpen(true);
  };

  const handleAgencyMouseLeave = () => {
    agencyTimeoutRef.current = setTimeout(() => {
      setAgencyDropdownOpen(false);
    }, 150);
  };

  const handleIntelligenceMouseEnter = () => {
    if (intelligenceTimeoutRef.current) clearTimeout(intelligenceTimeoutRef.current);
    setIntelligenceDropdownOpen(true);
  };

  const handleIntelligenceMouseLeave = () => {
    intelligenceTimeoutRef.current = setTimeout(() => {
      setIntelligenceDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (filmTimeoutRef.current) clearTimeout(filmTimeoutRef.current);
      if (agencyTimeoutRef.current) clearTimeout(agencyTimeoutRef.current);
      if (intelligenceTimeoutRef.current) clearTimeout(intelligenceTimeoutRef.current);
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
            title="ABRAM Network Home"
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
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-4">
          <div 
            className="relative"
            onMouseEnter={handleFilmMouseEnter}
            onMouseLeave={handleFilmMouseLeave}
          >
            <Link
              href="/film-production"
              title="Film Production Suite"
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex items-center gap-1 border border-transparent ${
                pathname.startsWith("/film-production")
                  ? "bg-white/10 text-white border-white/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              Film Production
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${filmDropdownOpen ? 'rotate-180' : ''}`} />
            </Link>
            <AnimatePresence>
              {filmDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-white/8 bg-zinc-950/98 backdrop-blur-[32px] p-2 shadow-2xl flex flex-col gap-1 z-50 pointer-events-auto"
                >
                  <Link
                    href="/film-production"
                    onClick={() => setFilmDropdownOpen(false)}
                    title="Film Production Overview Hub"
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
                    onClick={() => setFilmDropdownOpen(false)}
                    title="AI Script Breakdown & Screenplay Parser"
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
                    onClick={() => setFilmDropdownOpen(false)}
                    title="Film Production Scheduling & Budgeting"
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
                    onClick={() => setFilmDropdownOpen(false)}
                    title="Digital Call Sheets & Crew Call Times"
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

          <div 
            className="relative"
            onMouseEnter={handleAgencyMouseEnter}
            onMouseLeave={handleAgencyMouseLeave}
          >
            <Link
              href="/agency"
              title="Creative Agency Operations Suite"
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex items-center gap-1 border border-transparent ${
                pathname.startsWith("/agency")
                  ? "bg-white/10 text-white border-white/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              Creative Ops
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${agencyDropdownOpen ? 'rotate-180' : ''}`} />
            </Link>
            <AnimatePresence>
              {agencyDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-white/8 bg-zinc-950/98 backdrop-blur-[32px] p-2 shadow-2xl flex flex-col gap-1 z-50 pointer-events-auto"
                >
                  <Link
                    href="/agency"
                    onClick={() => setAgencyDropdownOpen(false)}
                    title="Creative Operations Overview Hub"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Overview Hub</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Suite control cockpit & client dashboard</p>
                    </div>
                  </Link>

                  <Link
                    href="/agency/client-intake"
                    onClick={() => setAgencyDropdownOpen(false)}
                    title="Client Intake Briefs & Requirements"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Client Intake</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Intake forms, briefs & requirements</p>
                    </div>
                  </Link>

                  <Link
                    href="/agency/crew-roster"
                    onClick={() => setAgencyDropdownOpen(false)}
                    title="Crew Roster & Contractor Availability"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Crew Roster</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Contractor directory & availability</p>
                    </div>
                  </Link>

                  <Link
                    href="/agency/smart-scheduling"
                    onClick={() => setAgencyDropdownOpen(false)}
                    title="AI Smart Scheduling & Crew Booking"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Smart Scheduling</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">AI-driven matching & booking board</p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div 
            className="relative"
            onMouseEnter={handleIntelligenceMouseEnter}
            onMouseLeave={handleIntelligenceMouseLeave}
          >
            <Link
              href="/intelligence"
              title="Creative Intelligence Suite"
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex items-center gap-1 border border-transparent ${
                pathname.startsWith("/intelligence")
                  ? "bg-white/10 text-white border-white/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              Intelligence
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${intelligenceDropdownOpen ? 'rotate-180' : ''}`} />
            </Link>
            <AnimatePresence>
              {intelligenceDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-64 rounded-2xl border border-white/8 bg-zinc-950/98 backdrop-blur-[32px] p-2 shadow-2xl flex flex-col gap-1 z-50 pointer-events-auto"
                >
                  <Link
                    href="/intelligence/creative-copilot"
                    onClick={() => setIntelligenceDropdownOpen(false)}
                    title="ABRAM Core AI Workspace Co-Pilot"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">ABRAM</h4>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white text-[8px] uppercase font-bold tracking-wider">
                          Core AI
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Central conversational agent & workspace co-pilot</p>
                    </div>
                  </Link>

                  <Link
                    href="/intelligence"
                    onClick={() => setIntelligenceDropdownOpen(false)}
                    title="ROI Yield Engine Calculator"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">ROI Engine</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">ROI calculator & yield overview</p>
                    </div>
                  </Link>

                  <Link
                    href="/intelligence/brain"
                    onClick={() => setIntelligenceDropdownOpen(false)}
                    title="Production Brain Workspace Memory & Search"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Production Brain</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Workspace memory & search</p>
                    </div>
                  </Link>

                  <Link
                    href="/intelligence/brief-intelligence"
                    onClick={() => setIntelligenceDropdownOpen(false)}
                    title="Brief Intelligence Blueprints & Scoping"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Brief Intelligence</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">Brief blueprints & scoping</p>
                    </div>
                  </Link>

                  <Link
                    href="/intelligence/crew-matchmaking"
                    onClick={() => setIntelligenceDropdownOpen(false)}
                    title="Crew Suitability Matchmaking Index"
                    className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-200 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors font-sans">Crew Matchmaking</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">100-pt crew suitability index</p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/blog"
            title="Subscribe to ABRAM Intelligence"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname.startsWith("/blog")
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Subscribe to ABRAM Intelligence
          </Link>
          <Link
            href="/pricing"
            title="ABRAM Platform Pricing Plans"
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
            title="Get Started with ABRAM App"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-zinc-200 transition-all duration-200 shadow-md shadow-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Get Started
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </nav>

      </div>

    </header>
  );
}
