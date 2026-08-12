"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Check,
  Globe,
  Layers,
  ExternalLink,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  FileText,
  Smartphone,
  Video,
  Share2,
  Tag,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import LinkHubDesignControls from "@/components/LinkHubDesignControls";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
      {children}
    </span>
  );
}

/* =========================================================================
   CANONICAL LINK HUB THEMES (From src/lib/linkHub.ts THEME_PRESETS)
   ========================================================================= */
const phoneThemes = [
  {
    id: "midnight",
    name: "Midnight Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-[#0A0A0A]",
    headerText: "text-white",
    subtext: "text-blue-200/70",
    cardBg: "bg-[#111C33]/40 border border-white/10 rounded-2xl shadow-lg",
    cardText: "text-[#8ECAFF]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#8ECAFF]/20 text-[#8ECAFF] rounded-xl",
    socialBg: "bg-[#111C33]/40 border border-white/10 text-[#8ECAFF]",
    dotBg: "bg-[#8ECAFF]",
    arrowColor: "text-zinc-400",
  },
  {
    id: "paper",
    name: "Paper Preset",
    isLight: true,
    fontClass: "font-sans",
    bg: "bg-[#F5F4F0]",
    headerText: "text-[#0A0A0A]",
    subtext: "text-zinc-600",
    cardBg: "bg-white border-2 border-[#0A0A0A] rounded-sm shadow-[3px_3px_0px_#0A0A0A]",
    cardText: "text-[#0A0A0A]",
    cardSub: "text-zinc-600",
    iconBg: "bg-[#0A0A0A] text-white rounded-sm",
    socialBg: "bg-white border-2 border-[#0A0A0A] text-[#0A0A0A]",
    dotBg: "bg-[#0A0A0A]",
    arrowColor: "text-[#0A0A0A]",
  },
  {
    id: "studio",
    name: "Studio Preset",
    isLight: false,
    fontClass: "font-display",
    bg: "bg-[#101014]",
    headerText: "text-white",
    subtext: "text-purple-200/70",
    cardBg: "bg-[#1C1A22] border border-[#C4A6FF]/20 rounded-full shadow-md",
    cardText: "text-[#C4A6FF]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#C4A6FF]/20 text-[#C4A6FF] rounded-full",
    socialBg: "bg-[#1C1A22] border border-[#C4A6FF]/20 text-[#C4A6FF]",
    dotBg: "bg-[#C4A6FF]",
    arrowColor: "text-[#C4A6FF]",
  },
  {
    id: "daylight",
    name: "Daylight Preset",
    isLight: true,
    fontClass: "font-sans",
    bg: "bg-gradient-to-b from-white to-[#DCEBFF]",
    headerText: "text-[#0A0A0A]",
    subtext: "text-blue-700/80",
    cardBg: "bg-[#0A0A0A] border border-black/10 rounded-full shadow-lg",
    cardText: "text-white",
    cardSub: "text-zinc-300",
    iconBg: "bg-white/20 text-white rounded-full",
    socialBg: "bg-white border border-blue-200 text-[#2563EB] shadow-sm",
    dotBg: "bg-[#2563EB]",
    arrowColor: "text-white",
  },
  {
    id: "reel",
    name: "Reel Preset",
    isLight: false,
    fontClass: "font-mono",
    bg: "bg-[#07110D]",
    headerText: "text-[#EAFFF5]",
    subtext: "text-emerald-400/80",
    cardBg: "bg-[#07110D] border border-[#4ADE80] rounded-none shadow-[0_0_15px_rgba(74,222,128,0.15)]",
    cardText: "text-[#4ADE80]",
    cardSub: "text-emerald-200/60",
    iconBg: "bg-[#4ADE80]/20 text-[#4ADE80] rounded-none",
    socialBg: "bg-[#07110D] border border-[#4ADE80] text-[#4ADE80]",
    dotBg: "bg-[#4ADE80]",
    arrowColor: "text-[#4ADE80]",
  },
  {
    id: "ember",
    name: "Ember Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-[#140A08]",
    headerText: "text-white",
    subtext: "text-orange-200/70",
    cardBg: "bg-[#1F110C] border border-[#FF9E64]/25 rounded-2xl shadow-xl",
    cardText: "text-[#FF9E64]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#FF9E64]/20 text-[#FF9E64] rounded-xl",
    socialBg: "bg-[#1F110C] border border-[#FF9E64]/25 text-[#FF9E64]",
    dotBg: "bg-[#FF9E64]",
    arrowColor: "text-[#FF9E64]",
  },
  {
    id: "carbon",
    name: "Carbon Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-black",
    headerText: "text-white",
    subtext: "text-zinc-400",
    cardBg: "bg-transparent border border-white/30 rounded-full",
    cardText: "text-white",
    cardSub: "text-zinc-400",
    iconBg: "bg-white/10 text-white rounded-full",
    socialBg: "bg-transparent border border-white/30 text-white",
    dotBg: "bg-white",
    arrowColor: "text-white",
  },
  {
    id: "signal",
    name: "Signal Preset",
    isLight: false,
    fontClass: "font-display",
    bg: "bg-[#0A0A0A]",
    headerText: "text-white",
    subtext: "text-zinc-400",
    cardBg: "bg-white text-[#0A0A0A] rounded-full shadow-lg",
    cardText: "text-[#0A0A0A]",
    cardSub: "text-zinc-600",
    iconBg: "bg-[#0A0A0A] text-white rounded-full",
    socialBg: "bg-white text-[#0A0A0A]",
    dotBg: "bg-white",
    arrowColor: "text-[#0A0A0A]",
  },
];

/* =========================================================================
   STATIC STYLED PHONE MOCKUP (Visual Card for Hero Section)
   ========================================================================= */
function PhoneVisualMockup() {
  const [themeIndex, setThemeIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % phoneThemes.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const activeTheme = phoneThemes[themeIndex];

  return (
    <div className={`w-[310px] h-[600px] rounded-[52px] border-[9px] border-zinc-800 p-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden select-none flex flex-col justify-between border-t-zinc-700 border-b-zinc-900 transition-colors duration-700 ${activeTheme.bg}`}>
      {/* Top Dynamic Island Notch */}
      <div>
        <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto relative z-20 flex items-center justify-end px-2 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800/80" />
        </div>

        {/* Animated Inner Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTheme.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`space-y-4 text-center pt-3 ${activeTheme.fontClass}`}
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full border-2 border-white/20 shadow-xl overflow-hidden relative mx-auto shrink-0">
              <Image
                src="/creators/alexa-avatar.jpg"
                alt="Alexa Rivera Profile Photo"
                fill
                sizes="64px"
                className="object-cover"
                priority
              />
            </div>

            {/* Profile Name & Tagline */}
            <div>
              <div className={`text-base font-semibold tracking-tight transition-colors duration-500 ${activeTheme.headerText}`}>
                Alexa Rivera
              </div>
              <div className={`text-[11px] mt-0.5 transition-colors duration-500 ${activeTheme.subtext}`}>
                Tech & Lifestyle Creator · 420K
              </div>
            </div>

            {/* Social Icons Row */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                <Globe className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Link Cards Showcase */}
            <div className="space-y-2.5 pt-4 px-1">
              <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                      Work With Me & Rates
                    </div>
                    <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                      Sponsorship inquiry form
                    </div>
                  </div>
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
              </div>

              <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                      20% Off Onyx Gear
                    </div>
                    <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                      Code ALEXA20 at checkout
                    </div>
                  </div>
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
              </div>

              <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                      2026 Tech Desk Setup
                    </div>
                    <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                      Full gear list & links
                    </div>
                  </div>
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Footer & iOS Home Indicator Bar */}
      <div className="pb-1 text-center">
        <div className={`text-[9px] tracking-wide mb-2 transition-colors duration-500 ${activeTheme.isLight ? "text-zinc-600 font-semibold" : "text-zinc-500"}`}>
          Powered by ABRAM
        </div>
        <div className={`w-28 h-1 rounded-full mx-auto transition-colors duration-500 ${activeTheme.isLight ? "bg-black/30" : "bg-white/20"}`} />
      </div>
    </div>
  );
}

const scopeItems = [
  {
    icon: Users,
    title: "Brand Client Directory",
    desc: "Every brand gets a portal record, set to project or retainer.",
  },
  {
    icon: Globe,
    title: "Free Link Hub Bio Page",
    desc: "Public page at abram.network/l/yourname, free on every plan.",
  },
  {
    icon: Briefcase,
    title: "Brand Deal Projects",
    desc: "Central workspace for campaign budgets, live dates & schedules.",
  },
  {
    icon: Layers,
    title: "Asset Status Lifecycle",
    desc: "5-stage deliverable progress with revision rounds counted.",
  },
  {
    icon: ShieldCheck,
    title: "Brand Approval Portals",
    desc: "No-account token links for 1-click client reviews.",
  },
  {
    icon: CreditCard,
    title: "Stripe Invoicing",
    desc: "Card payments into your own Stripe account, with due dates.",
  },
];

export default function CreatorsClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [approved, setApproved] = useState(false);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-20 pb-20 relative isolate">
      {/* Top Hero Split Layout (Left: Phone Visual Card, Right: Value Prop & Stats) */}
      <section className="w-full py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT SIDE: Phone Visual Card Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col items-center"
          >
            <PhoneVisualMockup />
          </motion.div>

          {/* RIGHT SIDE: Headline, Value Prop & Business Overview Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            <div>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
                ABRAM FOR CREATORS & INFLUENCERS
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] mb-4 font-sans">
                Run your social media like a production company.
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed">
                Brand deal projects, deliverable status tracking, passwordless client portals, and Stripe invoicing. The Link Hub bio page is free on every plan.
              </p>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap gap-3.5 items-center">
              <Link href="/pricing" className="btn-primary rounded-full px-7 py-3 text-xs font-medium flex items-center gap-2">
                <span>Start Free Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#features" className="btn-glass rounded-full px-7 py-3 text-xs font-medium">
                Explore Features
              </Link>
            </div>

            {/* Key Commercial Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Tracked Revenue (YTD)</div>
                <div className="text-2xl font-mono font-semibold text-white">$42,800</div>
                <div className="text-[10px] text-emerald-400 font-sans mt-1">+$8,500 this month</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Outstanding Invoices</div>
                <div className="text-2xl font-mono font-semibold text-amber-300">$12,500</div>
                <div className="text-[10px] text-amber-300/80 font-sans mt-1">3 Pending settlements</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Active Brand Deals</div>
                <div className="text-2xl font-mono font-semibold text-white">4 Clients</div>
                <div className="text-[10px] text-zinc-400 font-sans mt-1">Onyx, Helix, Aura, Sensa</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mb-1">Asset Approvals</div>
                <div className="text-2xl font-mono font-semibold text-emerald-400">8 / 11</div>
                <div className="text-[10px] text-emerald-400 font-sans mt-1">73% Campaign completion</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Commercial Operations Features */}
      <section id="features" className="w-full py-20 px-4 sm:px-6 lg:px-8 space-y-24 max-w-7xl mx-auto">
        
        {/* Module 1: Client CRM & Directory */}
        <div className="w-full space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">01 · CLIENT DIRECTORY</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mt-1">Brand Client Directory & Deal Budgets</h2>
          </div>

          <div className="w-full p-6 rounded-2xl border border-white/10 bg-zinc-900/30 overflow-x-auto">
            <p className="text-[10px] text-zinc-500 mb-2 md:hidden">Swipe to view →</p>
            <div className="min-w-[700px] space-y-3">
              <div className="grid grid-cols-12 text-[10px] uppercase font-semibold tracking-wider text-zinc-500 px-4 py-2 bg-white/[0.02] rounded-lg">
                <div className="col-span-3">Brand Client</div>
                <div className="col-span-3">Portal Access</div>
                <div className="col-span-2">Engagement</div>
                <div className="col-span-2">Deal Budget</div>
                <div className="col-span-2 text-right">Project Status</div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-semibold text-white">Onyx Apparel</div>
                <div className="col-span-3 text-zinc-300">nadia@onyxapparel.co</div>
                <div className="col-span-2 text-zinc-400">Retainer</div>
                <div className="col-span-2 font-mono font-bold text-white">$24,500</div>
                <div className="col-span-2 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                    In Progress
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-semibold text-white">Helix Technologies</div>
                <div className="col-span-3 text-zinc-300">marcus@helixtech.io</div>
                <div className="col-span-2 text-zinc-400">Project-based</div>
                <div className="col-span-2 font-mono font-bold text-white">$18,000</div>
                <div className="col-span-2 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-zinc-300 bg-white/[0.06] border-white/[0.12]">
                    Planning
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-semibold text-white">Aura Audio</div>
                <div className="col-span-3 text-zinc-300">elena@auraaudio.co</div>
                <div className="col-span-2 text-zinc-400">Project-based</div>
                <div className="col-span-2 font-mono font-bold text-white">$12,400</div>
                <div className="col-span-2 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-zinc-300 bg-white/[0.06] border-white/[0.12]">
                    On Hold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Deliverable Lifecycle Statuses */}
        <div className="w-full space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">02 · PROOFING & LIFECYCLE</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mt-1">5-Stage Deliverable Status Lifecycle</h2>
          </div>

          <div className="w-full p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white font-sans text-xs">YouTube Dedicated Review</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans shrink-0">
                    Approved
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">Stage 4 of 5 · Revision Round 1 Completed & Signed Off</div>
                <div className="text-[11px] text-zinc-500 font-sans pt-1 border-t border-white/[0.04]">
                  Client note: &ldquo;Intro hook is sharp. Approved for publish on Sept 14.&rdquo;
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-semibold text-white font-sans text-xs">TikTok Story & Reel Cutdown</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans shrink-0">
                    In Review
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">Stage 3 of 5 · Token portal review link active</div>
                <div className="text-[11px] text-zinc-500 font-sans pt-1 border-t border-white/[0.04]">
                  Client note: &ldquo;Draft received. Reviewing copy before final sign-off.&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Client Portal */}
        <div className="w-full space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">03 · CLIENT PORTAL</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mt-1">Passwordless Brand Approval Link</h2>
          </div>

          <div className="w-full p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
              <div>
                <div className="text-sm font-semibold text-white font-sans">Onyx Apparel · Autumn Campaign Portal</div>
                <div className="text-xs text-zinc-400 font-sans mt-0.5">Client Contact: Nadia Ruiz (Zero-login token verified)</div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-zinc-400 font-sans">Approval Progress</div>
                <div className="text-sm font-mono font-semibold text-emerald-400">75% Approved (3/4 Assets)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Portal Asset 01 */}
              <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white font-sans">Asset 01: YouTube Dedicated Review</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium">
                    1-Click Approved
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 font-sans italic">
                  &ldquo;Approved for publish on Sept 14.&rdquo;
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  Approved by Nadia Ruiz · Sept 10, 2026
                </div>
              </div>

              {/* Portal Asset 02 */}
              <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white font-sans">Asset 02: TikTok Cutdown 01</span>
                  <button
                    type="button"
                    onClick={() => setApproved(!approved)}
                    className={`px-3 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
                      approved
                        ? "bg-emerald-500 text-zinc-950 font-semibold shadow-md"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{approved ? "Approved by Brand" : "Click to Approve Asset"}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 font-sans italic">
                  &ldquo;Intro hook is sharp. Ready to approve.&rdquo;
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  Token Link: <span className="font-mono text-zinc-400">abram.network/portal/token_8f92a4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 4: Invoices & Stripe Ledger */}
        <div className="w-full space-y-6">
          <div className="border-b border-white/[0.06] pb-4">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">04 · FINANCIAL ENGINE</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mt-1">Invoicing & Stripe Card Payments</h2>
          </div>

          <div className="w-full p-6 rounded-2xl border border-white/10 bg-zinc-900/30 overflow-x-auto">
            <p className="text-[10px] text-zinc-500 mb-2 md:hidden">Swipe to view →</p>
            <div className="min-w-[700px] space-y-3">
              <div className="grid grid-cols-12 text-[10px] uppercase font-semibold tracking-wider text-zinc-500 px-4 py-2 bg-white/[0.02] rounded-lg">
                <div className="col-span-3">Invoice Number</div>
                <div className="col-span-4">Brand Client</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-3 text-right">Status</div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-mono text-zinc-400">INV-2026-004</div>
                <div className="col-span-4 font-semibold text-white">Onyx Apparel</div>
                <div className="col-span-2 font-mono font-bold text-white">$8,500</div>
                <div className="col-span-3 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                    Paid (Stripe card)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-mono text-zinc-400">INV-2026-005</div>
                <div className="col-span-4 font-semibold text-white">Helix Tech</div>
                <div className="col-span-2 font-mono font-bold text-white">$3,200</div>
                <div className="col-span-3 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-zinc-300 bg-white/[0.06] border-white/[0.12]">
                    Sent · Due Sept 12
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-xs font-sans">
                <div className="col-span-3 font-mono text-zinc-400">INV-2026-002</div>
                <div className="col-span-4 font-semibold text-white">Aura Audio</div>
                <div className="col-span-2 font-mono font-bold text-zinc-200">$4,500</div>
                <div className="col-span-3 text-right">
                  <span className="text-[10px] px-2.5 py-1 rounded-full border font-sans font-medium text-amber-300 bg-amber-500/10 border-amber-500/20">
                    Sent · Overdue since Jul 8
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Link Hub Design Controls */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            LINK HUB DESIGN
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mb-3">
            Make the page look like you
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            The page is free on every plan. These controls unlock at Solo Lite, and Solo Pro removes the
            Powered by ABRAM credit.{" "}
            <Link
              href="/alternatives/linktree"
              className="text-zinc-300 hover:text-white underline underline-offset-2"
            >
              Compare Link Hub
            </Link>
            .
          </p>
        </div>

        <LinkHubDesignControls />
      </section>

      {/* System Scope Grid */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            SYSTEM SCOPE
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Everything you need to run your social media
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scopeItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-6 rounded-2xl border border-white/10 bg-zinc-900/30 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white font-sans mb-1.5">{item.title}</h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Solo Creator Pricing Cards (Removed "Seat" phrasing) */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            SOLO CREATOR PRICING
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mb-3">
            Plans built for solo creator operations
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Start free with Link Hub included. Upgrade as your invoicing and brand client portal needs scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Free Plan */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-400 font-sans mb-1">Free</div>
              <div className="text-3xl font-bold text-white font-sans mb-1">$0 <span className="text-xs font-normal text-zinc-500">/mo</span></div>
              <div className="text-[11px] text-zinc-500 font-mono mb-6">80 trial AI credits · 500 MB Storage</div>
              <ul className="space-y-3 text-xs text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Free Link Hub bio page (abram.network/l/you)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Link & social media profile buttons</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1 Active brand sponsorship project</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Issue up to 3 brand invoices / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> 3% Processing Fee on payments received</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Watermarked PDF quotes, invoices & exports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> View-only resource scheduler</li>
              </ul>
            </div>
            <Link href="/pricing" className="btn-glass rounded-full text-center py-2.5 text-xs font-medium w-full">Start Free</Link>
          </div>

          {/* Solo Lite Plan */}
          <div className="rounded-2xl border border-white/20 bg-zinc-900/60 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-200 font-sans">Solo Lite</span>
                <span className="text-[10px] text-zinc-400 font-sans font-medium">$17/mo billed annually</span>
              </div>
              <div className="text-3xl font-bold text-white font-sans mb-1">$19 <span className="text-xs font-normal text-zinc-500">/mo</span></div>
              <div className="text-[11px] text-zinc-400 font-mono mb-6">300 monthly AI credits · 3 GB Storage</div>
              <ul className="space-y-3 text-xs text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full Link Hub custom themes, fonts & styling</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Scheduled start & end dates on promo links</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 3 active brand campaign projects</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Issue up to 10 brand invoices / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Track up to 30 gear & resource items</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> 3% Processing Fee on payments received</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 10 crew per brand project</li>
              </ul>
            </div>
            <Link href="/pricing" className="btn-glass rounded-full text-center py-2.5 text-xs font-medium w-full">Choose Lite</Link>
          </div>

          {/* Solo Pro Plan */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-400 font-sans">Solo Pro</span>
                <span className="text-[10px] text-emerald-400/80 font-sans font-medium">$31/mo billed annually</span>
              </div>
              <div className="text-3xl font-bold text-white font-sans mb-1">$34 <span className="text-xs font-normal text-zinc-500">/mo</span></div>
              <div className="text-[11px] text-emerald-400/80 font-mono mb-6">600 monthly AI credits · 10 GB Storage</div>
              <ul className="space-y-3 text-xs text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited active brand campaign projects</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 5 Brand Client Portals (zero-login review links)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited invoicing & CSV financial exports</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Watermark-free exports & hide Link Hub branding</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1% Processing Fee (first $10,000/mo fee-free)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> AI brief parser & AI talent search</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Calendar feed sync, Slack & Frame.io review</li>
              </ul>
            </div>
            <Link href="/pricing" className="btn-primary rounded-full text-center py-2.5 text-xs font-medium w-full">Get Solo Pro</Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Questions & Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left font-sans text-xs sm:text-sm font-medium text-zinc-200 hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${activeFaq === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-xs text-zinc-400 font-sans leading-relaxed border-t border-white/[0.04] pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-12">
          <h2 className="text-2xl sm:text-4xl font-medium text-white font-sans mb-3">
            Claim your link, then run your business behind it.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
            Claim your link in two minutes for free. Bring your brand deals, deliverable approvals, and Stripe invoices under one home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="https://app.abram.network" target="_blank" rel="noopener noreferrer" className="btn-primary rounded-full px-6 py-2.5 text-xs font-medium w-full sm:w-auto flex items-center justify-center gap-2">
              <span>Open ABRAM</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Link href="/pricing" className="btn-glass rounded-full px-6 py-2.5 text-xs font-medium w-full sm:w-auto">
              See All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
          Brand and campaign names shown in product figures are invented placeholders. Plan prices and limits reflect the published ABRAM pricing page as of August 2026. The Processing Fee applies to payments you receive and is computed on your own plan.
        </p>
      </section>
    </main>
  );
}
