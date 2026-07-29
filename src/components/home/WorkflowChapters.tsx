"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScopeMockups from "@/components/home/ScopeMockups";
import AgencyClientPortalMockup from "@/components/agency/AgencyClientPortalMockup";

export function ChapterHeader({
  number,
  overline,
  title,
  body,
}: {
  number: string;
  overline: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px", amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center max-w-2xl mx-auto mb-10 md:mb-14"
    >
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-flex items-center gap-2 font-sans">
        <span className="text-zinc-600 font-sans">{number}</span>
        {overline}
      </span>
      <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">{body}</p>
    </motion.div>
  );
}

export function ChapterFooterLinks({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200"
        >
          {l.label}
          <ArrowUpRight className="w-4 h-4 opacity-60" />
        </Link>
      ))}
    </div>
  );
}

export function ScopeChapter() {
  return (
    <section className="relative w-full py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <ChapterHeader
          number="01"
          overline="SCOPE"
          title="Turn any idea into a film, campaign, or project."
          body="Bring any brief or script into ABRAM. Instantly map deliverables, match roster availability, and lock quotes before day one."
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <ScopeMockups />
        </motion.div>
        <ChapterFooterLinks
          links={[
            { label: "Explore Brief Intelligence", href: "/intelligence/brief-intelligence" },
            { label: "Explore Client Intake", href: "/agency/client-intake" },
          ]}
        />
      </div>
    </section>
  );
}

export function DeliverChapter() {
  return (
    <section className="relative w-full py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <ChapterHeader
          number="03"
          overline="DELIVER & GET PAID"
          title="Win approvals faster and pay crew the same week."
          body="Clients review, approve, and pay in a branded portal. Crew payouts run through Stripe."
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <AgencyClientPortalMockup />
        </motion.div>
        <ChapterFooterLinks
          links={[
            { label: "Explore Client Portals", href: "/agency/client-portal" },
          ]}
        />
      </div>
    </section>
  );
}
