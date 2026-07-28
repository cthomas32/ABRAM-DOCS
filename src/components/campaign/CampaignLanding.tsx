"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarRange,
  Check,
  ChevronDown,
  ClipboardList,
  Gauge,
  Inbox,
  Layers,
  Package,
  Receipt,
  ScanText,
  Share2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { buildSignupUrl, type BenefitIcon, type CampaignVariant } from "@/lib/campaigns";
import { useCampaignTracking } from "./useCampaignTracking";
import CampaignVisual from "./CampaignVisual";

const ICONS: Record<BenefitIcon, React.ComponentType<{ className?: string }>> = {
  scan: ScanText,
  calendar: CalendarRange,
  clipboard: ClipboardList,
  users: Users,
  package: Package,
  wallet: Wallet,
  gauge: Gauge,
  inbox: Inbox,
  share: Share2,
  receipt: Receipt,
  layers: Layers,
  sparkles: Sparkles,
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const VIEWPORT = { once: true, margin: "-60px" } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/* FAQ row                                                             */
/* ------------------------------------------------------------------ */
function FaqRow({
  question,
  answer,
  onOpen,
}: {
  question: string;
  answer: string;
  onOpen: (question: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((prev) => {
      if (!prev) onOpen(question);
      return !prev;
    });
  };

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 text-left py-4 min-h-[44px] cursor-pointer group"
      >
        <span className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors break-words text-balance">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 mt-0.5 text-zinc-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <p className="text-sm text-zinc-400 leading-relaxed pb-4 pr-8 break-words text-pretty">{answer}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */
export default function CampaignLanding({ variant }: { variant: CampaignVariant }) {
  const { track, attribution } = useCampaignTracking(variant.slug);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const signupUrl = useMemo(
    () => buildSignupUrl(variant.slug, attribution),
    [variant.slug, attribution]
  );

  const handleSignupClick = useCallback(
    (placement: string) => {
      track("cta_click", placement);
      track("signup_click", placement);
    },
    [track]
  );

  // Reveal the mobile action bar once the visitor leaves the hero, so it
  // never competes with the hero for the largest contentful paint.
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setShowStickyCta(window.scrollY > window.innerHeight * 0.6);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative w-full">
      {/* ============================================================ */}
      {/* HERO: copy left, product right                                */}
      {/* ============================================================ */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-20">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] h-[220px] md:w-[720px] md:h-[380px] bg-gradient-to-b from-[#8ECAFF]/8 via-[#3B82F6]/4 to-transparent rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
              {variant.eyebrow}
            </span>

            {/* text-balance keeps wrapped lines even, so no line is left
                holding a single orphan word on a narrow screen. */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-medium tracking-tight text-white leading-[1.1] break-words text-balance">
              {variant.headline}
              <span className="block mt-[4px] text-zinc-400 text-balance">
                {variant.headlineAccent}
              </span>
            </h1>

            <p className="mt-5 text-base text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0 text-pretty">
              {variant.subhead}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <a
                href={signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSignupClick("hero")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-7 py-3 text-sm font-semibold hover:bg-zinc-200 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.08)]"
              >
                {variant.primaryCta}
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="/pricing"
                onClick={() => track("cta_click", "hero-pricing")}
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
              >
                See pricing
              </a>
            </div>

            <p className="mt-4 text-xs font-medium tracking-wide text-zinc-500">
              {variant.trustLine}
            </p>
          </div>

          {/* Product visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <CampaignVisual kind={variant.heroVisual} />
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HIGHLIGHT STRIP: horizontal, one line each                    */}
      {/* ============================================================ */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {variant.highlights.map((highlight, index) => {
            const Icon = ICONS[highlight.icon];
            return (
              <motion.div
                key={highlight.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.15), ease: EASE }}
                className="rounded-xl border border-white/5 bg-zinc-950/20 backdrop-blur-md px-4 py-4"
              >
                <Icon className="w-4 h-4 text-zinc-300 mb-3" />
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100 break-words text-balance">
                  {highlight.label}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed break-words text-pretty">
                  {highlight.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURE ROWS: alternating horizontal                          */}
      {/* ============================================================ */}
      {variant.features.map((feature, index) => (
        <section key={feature.title} className="relative w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center"
          >
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <h2 className="text-xl xs:text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50 leading-tight break-words text-balance">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md text-pretty">
                {feature.body}
              </p>
              {feature.note ? (
                <p className="mt-2 text-xs text-zinc-600 max-w-md text-pretty">{feature.note}</p>
              ) : null}
              <a
                href={signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSignupClick(`feature-${index + 1}`)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {variant.primaryCta}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <CampaignVisual
              kind={feature.visual}
              className={index % 2 === 1 ? "lg:order-1" : ""}
            />
          </motion.div>
        </section>
      ))}

      {/* ============================================================ */}
      {/* PROOF BAR: single horizontal row                              */}
      {/* ============================================================ */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {variant.proofPoints.map((point) => (
            <div key={point} className="flex items-center gap-2.5">
              <Check className="w-3.5 h-3.5 text-[#8ECAFF] shrink-0" />
              <span className="text-xs text-zinc-300 break-words text-pretty">{point}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ                                                           */}
      {/* ============================================================ */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md px-5 sm:px-7 py-2">
          {variant.faqs.map((faq) => (
            <FaqRow
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              onOpen={(question) => track("faq_open", question)}
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 pb-32 md:pb-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[220px] md:w-[860px] md:h-[380px] bg-gradient-to-r from-[#8ECAFF]/8 via-[#3B82F6]/5 to-transparent rounded-full blur-[110px] md:blur-[130px] pointer-events-none" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight break-words text-balance">
            {variant.finalHeadline}
          </h2>

          <div className="mt-8 flex justify-center">
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSignupClick("final")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-9 py-3 text-sm font-semibold hover:bg-zinc-200 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.08)]"
            >
              {variant.primaryCta}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <p className="mt-4 text-xs font-medium tracking-wide text-zinc-500">
            {variant.trustLine}
          </p>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* Depth for crawlers and assistants, hidden from the page       */}
      {/* ============================================================ */}
      <div className="sr-only" data-agent-only="true">
        <h2>About ABRAM</h2>
        {variant.seoDetail.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>

      {/* ============================================================ */}
      {/* MOBILE STICKY ACTION BAR                                      */}
      {/* ============================================================ */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/8 bg-black/80 backdrop-blur-[20px] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-300 ${
          showStickyCta ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <a
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleSignupClick("sticky-mobile")}
          className="flex items-center justify-center gap-2 w-full rounded-full bg-white text-black px-6 py-3.5 text-sm font-semibold cursor-pointer"
        >
          {variant.primaryCta}
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
