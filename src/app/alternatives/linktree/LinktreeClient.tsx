"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LinkHubDesignControls from "@/components/LinkHubDesignControls";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUpRight as ArrowOut,
  Check,
  ChevronDown,
  Palette,
  CalendarClock,
  MousePointerClick,
  Briefcase,
  Globe,
  Link2,
  Heading,
  Share2,
  Mail,
  Phone,
  PlayCircle,
  FolderOpen,
  Tag,
  Video,
  Clock,
} from "lucide-react";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Faq = { q: string; a: string };

/* =========================================================================
   PHONE MOCKUP: a Link Hub page showing several block types at once.
   Themes mirror THEME_PRESETS in abram-network/src/lib/apps/linkHub.ts.
   ========================================================================= */
const mockThemes = [
  {
    id: "midnight",
    bg: "bg-[#0A0A0A]",
    header: "text-white",
    sub: "text-blue-200/70",
    card: "bg-[#111C33]/40 border border-white/10 rounded-2xl",
    cardText: "text-[#8ECAFF]",
    cardSub: "text-zinc-400",
    icon: "bg-[#8ECAFF]/20 text-[#8ECAFF] rounded-xl",
    social: "bg-[#111C33]/40 border border-white/10 text-[#8ECAFF]",
    rule: "bg-white/10",
    light: false,
  },
  {
    id: "paper",
    bg: "bg-[#F5F4F0]",
    header: "text-[#0A0A0A]",
    sub: "text-zinc-600",
    card: "bg-white border-2 border-[#0A0A0A] rounded-sm shadow-[3px_3px_0px_#0A0A0A]",
    cardText: "text-[#0A0A0A]",
    cardSub: "text-zinc-600",
    icon: "bg-[#0A0A0A] text-white rounded-sm",
    social: "bg-white border-2 border-[#0A0A0A] text-[#0A0A0A]",
    rule: "bg-black/15",
    light: true,
  },
  {
    id: "reel",
    bg: "bg-[#07110D]",
    header: "text-[#EAFFF5]",
    sub: "text-emerald-400/80",
    card: "bg-[#07110D] border border-[#4ADE80] rounded-none",
    cardText: "text-[#4ADE80]",
    cardSub: "text-emerald-200/60",
    icon: "bg-[#4ADE80]/20 text-[#4ADE80] rounded-none",
    social: "bg-[#07110D] border border-[#4ADE80] text-[#4ADE80]",
    rule: "bg-[#4ADE80]/25",
    light: false,
  },
  {
    id: "signal",
    bg: "bg-[#0A0A0A]",
    header: "text-white",
    sub: "text-zinc-400",
    card: "bg-white rounded-full",
    cardText: "text-[#0A0A0A]",
    cardSub: "text-zinc-600",
    icon: "bg-[#0A0A0A] text-white rounded-full",
    social: "bg-white text-[#0A0A0A]",
    rule: "bg-white/15",
    light: false,
  },
];

function PhoneMockup() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % mockThemes.length), 3600);
    return () => clearInterval(t);
  }, []);
  const th = mockThemes[i];

  return (
    <div
      className={`w-[280px] sm:w-[300px] h-[580px] rounded-[48px] border-[9px] border-zinc-800 border-t-zinc-700 border-b-zinc-900 p-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden select-none flex flex-col justify-between transition-colors duration-700 ${th.bg}`}
    >
      <div>
        <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto flex items-center justify-end px-2 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800/80" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={th.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="pt-4 text-center space-y-3.5"
          >
            {/* avatar block */}
            <div className="w-14 h-14 rounded-full border-2 border-white/20 shadow-xl overflow-hidden relative mx-auto shrink-0">
              <Image
                src="/creators/alexa-avatar.jpg"
                alt="Alexa Rivera profile photo"
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className={`text-sm font-semibold tracking-tight ${th.header}`}>Alexa Rivera</div>
              <div className={`text-[10px] mt-0.5 ${th.sub}`}>Tech &amp; Lifestyle Creator · 420K</div>
            </div>

            {/* social block */}
            <div className="flex items-center justify-center gap-2">
              {[Video, Share2, Globe].map((Ic, n) => (
                <div key={n} className={`w-7 h-7 rounded-full flex items-center justify-center ${th.social}`}>
                  <Ic className="w-3 h-3" />
                </div>
              ))}
            </div>

            {/* header block */}
            <div className="flex items-center gap-2 pt-1 px-1">
              <div className={`h-px flex-1 ${th.rule}`} />
              <span className={`text-[8px] font-semibold uppercase tracking-[0.18em] ${th.sub}`}>
                Live now
              </span>
              <div className={`h-px flex-1 ${th.rule}`} />
            </div>

            {/* featured link with thumbnail */}
            <div className={`p-2.5 text-left flex items-center gap-2.5 ${th.card}`}>
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${th.icon}`}>
                <Tag className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-semibold truncate ${th.cardText}`}>20% off Onyx Gear</div>
                <div className={`text-[8.5px] truncate ${th.cardSub}`}>Ends Sunday · code ALEXA20</div>
              </div>
              <ArrowOut className={`w-3 h-3 shrink-0 ${th.cardText}`} />
            </div>

            {/* video block */}
            <div className={`p-2.5 text-left flex items-center gap-2.5 ${th.card}`}>
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${th.icon}`}>
                <PlayCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-semibold truncate ${th.cardText}`}>Winter routine</div>
                <div className={`text-[8.5px] truncate ${th.cardSub}`}>Embedded video</div>
              </div>
            </div>

            {/* collection block */}
            <div className={`p-2.5 text-left flex items-center gap-2.5 ${th.card}`}>
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${th.icon}`}>
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-semibold truncate ${th.cardText}`}>All my gear</div>
                <div className={`text-[8.5px] truncate ${th.cardSub}`}>Collection · 9 links</div>
              </div>
              <ChevronDown className={`w-3 h-3 shrink-0 ${th.cardText}`} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-1 text-center">
        <div className={`text-[8px] tracking-wide mb-2 ${th.light ? "text-zinc-600 font-semibold" : "text-zinc-500"}`}>
          Powered by ABRAM
        </div>
        <div className={`w-24 h-1 rounded-full mx-auto ${th.light ? "bg-black/30" : "bg-white/20"}`} />
      </div>
    </div>
  );
}

/* =========================================================================
   Every capability below is read from the Link Hub source of truth in
   abram-network (src/lib/apps/linkHub.ts) and the plan registry. Nothing on
   this page describes another company's product internals or prices.
   ========================================================================= */

const blockTypes = [
  { name: "Link", icon: Link2, desc: "A destination with a label, description, icon and thumbnail." },
  { name: "Header", icon: Heading, desc: "A titled divider that groups the blocks beneath it." },
  { name: "Social", icon: Share2, desc: "The icon strip that sits under your bio." },
  { name: "Email", icon: Mail, desc: "Opens an addressed mail draft rather than a web page." },
  { name: "Phone", icon: Phone, desc: "Dials straight from a phone browser." },
  { name: "Video", icon: PlayCircle, desc: "An embedded video that plays on the page." },
  { name: "Collection", icon: FolderOpen, desc: "A folder holding links, contacts and videos together." },
];

const capabilities = [
  {
    icon: Globe,
    title: "A public page on every plan",
    body: "Link Hub publishes at abram.network/l/yourname. The page, the blocks and the click counts are included on the free plan, not held back as an upgrade.",
    points: ["Seven block types including collections", "Per block click counts"],
  },
  {
    icon: Palette,
    title: "Design controls from Solo Lite",
    body: "Themes, backgrounds, button styling, fonts, avatars and block highlights unlock at Solo Lite. Solo Pro additionally removes the Powered by ABRAM credit from the public page.",
    points: ["Full theming from $19/mo", "Remove ABRAM branding from $34/mo"],
  },
  {
    icon: CalendarClock,
    title: "Blocks that turn themselves on and off",
    body: "Every block carries an optional start and end time. A discount code block can go live the morning a campaign starts and retire itself the night it ends, with nothing to remember.",
    points: ["Scheduled start and end per block", "Active toggle for anything evergreen"],
  },
  {
    icon: Briefcase,
    title: "The link sits inside the deal workspace",
    body: "This is the structural difference. Your bio link lives in the same account that holds your brand deals, deliverable approvals and Stripe invoices. The link that wins the enquiry and the system that runs the resulting job are one product.",
    points: ["Same account as brand deal projects", "Same account as invoicing and portals"],
  },
];

const honestFit = {
  dedicated: [
    "You want deep bio link analytics: referrer breakdowns, geography, conversion funnels.",
    "You sell digital products or take tips directly from the bio page itself.",
    "You need a custom domain pointed at your bio page.",
    "The bio link is the whole job, and you have no brand deals to administer behind it.",
  ],
  linkHub: [
    "You run paid brand partnerships and the bio page is the front door to them.",
    "You want the discount code block to expire on its own when the campaign ends.",
    "You would rather not pay for a bio link tool and a deal tracker and an invoicing tool.",
    "You want the brand that found you through the link to approve deliverables in the same place.",
  ],
};

export default function LinktreeClient({ faqs }: { faqs: Faq[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (i: number) => setActiveFaq(activeFaq === i ? null : i);

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero */}
      <section className="relative w-full py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex justify-center order-first lg:order-none"
          >
            <PhoneMockup />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-6 text-left"
          >
            <motion.span
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans inline-block"
            >
              LINKTREE ALTERNATIVE
            </motion.span>

            <motion.h1
              variants={revealVariants}
              custom={0.05}
              className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08] font-sans"
            >
              A link in bio page with the business attached.
            </motion.h1>

            <motion.p
              variants={revealVariants}
              custom={0.15}
              className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed"
            >
              Link Hub is ABRAM&apos;s link in bio page, free on every plan. What makes it different is not the page. It is that the brand deals arriving through it are run in the same account: scope, approvals, invoices and payment.
            </motion.p>

            <motion.div variants={revealVariants} custom={0.3} className="flex flex-wrap gap-3 items-center">
              <Link
                href="/pricing"
                className="btn-primary rounded-full px-7 py-3 text-xs font-medium flex items-center gap-2"
              >
                <span>Claim your link free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/influencers" className="btn-glass rounded-full px-7 py-3 text-xs font-medium">
                ABRAM for Influencers
              </Link>
            </motion.div>

            <motion.div
              variants={revealVariants}
              custom={0.4}
              className="grid grid-cols-3 gap-4 pt-6 border-t border-white/[0.08]"
            >
              {[
                { v: "7", l: "Block types" },
                { v: "$0", l: "On every plan" },
                { v: "7", l: "Theme presets" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-mono font-semibold text-white">{s.v}</div>
                  <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider mt-1">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            WHAT LINK HUB DOES
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            The page, and everything behind it
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((c, i) => (
            <div
              key={c.title}
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">0{i + 1} MODULE</div>
                  <h3 className="text-base font-semibold text-white font-sans">{c.title}</h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">{c.body}</p>
              <ul className="space-y-2 pt-2 border-t border-white/[0.04]">
                {c.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-zinc-300 font-sans">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Blocks */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            BLOCK TYPES
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mb-3">
            Seven kinds of block
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Each one carries a label, a description, an icon, a thumbnail and its own click count.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {blockTypes.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.name}
                className="p-5 rounded-xl border border-white/10 bg-zinc-900/30 hover:border-white/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white font-sans mb-1">{b.name}</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{b.desc}</p>
              </div>
            );
          })}

          {/* Scheduling visual, sharing the grid so the row completes at 8 */}
          <div className="p-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white font-sans mb-1">Any block, scheduled</h3>
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-emerald-400/70 ml-[22%]" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>Sep 01</span>
                <span className="text-emerald-400">LIVE</span>
                <span>Sep 14</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Design controls */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            DESIGN CONTROLS
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans mb-3">
            How much you can change
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Included from Solo Lite at $19 a month. The free plan publishes a working page on the default theme.
          </p>
        </div>

        <LinkHubDesignControls />
      </section>

      {/* Honest fit */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            HONEST FIT
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Which one you actually want
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30 space-y-4">
            <h3 className="text-base font-semibold text-white font-sans">
              A dedicated link in bio tool suits you better if:
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              {honestFit.dedicated.map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] space-y-4">
            <h3 className="text-base font-semibold text-emerald-400 font-sans">Link Hub suits you better if:</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              {honestFit.linkHub.map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing strip */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            WHAT IT COSTS
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">
            Link Hub pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/30">
            <div className="text-xs font-semibold text-zinc-400 font-sans mb-1">Free</div>
            <div className="text-3xl font-bold text-white font-sans mb-4">
              $0 <span className="text-xs font-normal text-zinc-500">/mo</span>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Public page at abram.network/l/you</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> All seven block types</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Click counts per block</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" /> Default theme, ABRAM credit shown</li>
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-zinc-900/60 shadow-xl">
            <div className="text-xs font-semibold text-zinc-200 font-sans mb-1">Solo Lite</div>
            <div className="text-3xl font-bold text-white font-sans mb-4">
              $19 <span className="text-xs font-normal text-zinc-500">/mo</span>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Everything in Free</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Themes, backgrounds and images</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Button styling, fonts and avatars</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Scheduled start and end on blocks</li>
            </ul>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] shadow-2xl">
            <div className="text-xs font-semibold text-emerald-400 font-sans mb-1">Solo Pro</div>
            <div className="text-3xl font-bold text-white font-sans mb-4">
              $34 <span className="text-xs font-normal text-zinc-500">/mo</span>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300 font-sans">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Everything in Solo Lite</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Remove the Powered by ABRAM credit</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Brand client portals for five brands</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Unlimited invoicing through Stripe</li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 font-sans text-center mt-6">
          <MousePointerClick className="w-3 h-3 inline-block mr-1 -mt-0.5" />
          Prices are for the whole ABRAM plan, not a link in bio add on. See{" "}
          <Link href="/pricing" className="text-zinc-300 hover:text-white underline underline-offset-2">
            full pricing
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-medium text-white font-sans">Questions &amp; Answers</h2>
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
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 shrink-0 ml-3 transition-transform duration-200 ${
                    activeFaq === i ? "rotate-180" : ""
                  }`}
                />
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

      {/* Bottom CTA */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-12">
          <h2 className="text-2xl sm:text-4xl font-medium text-white font-sans mb-3">
            Claim your link, then run your business behind it.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8 font-sans leading-relaxed">
            The page is free on every plan. The deals, approvals and invoices are waiting in the same account when you need them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="https://app.abram.network"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary rounded-full px-6 py-2.5 text-xs font-medium w-full sm:w-auto flex items-center justify-center gap-2"
            >
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
          Disclaimer: Linktree is a trademark of Linktree Pty Ltd. ABRAM is an independent platform
          with no affiliation with, endorsement by, or sponsorship from Linktree. The Linktree name
          is used here only to identify the category of product a reader may be comparing. Every
          feature and price stated on this page describes ABRAM&apos;s own Link Hub and is accurate as
          of August 2026. For another provider&apos;s current features and prices, please see their own
          website.
        </p>
      </section>
    </main>
  );
}
