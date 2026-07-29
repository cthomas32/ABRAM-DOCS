"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, Users, BrainCircuit } from "lucide-react";

interface SuiteCard {
  overline: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ElementType;
  links: { label: string; href: string }[];
}

const SUITES: SuiteCard[] = [
  {
    overline: "FILM PRODUCTION",
    title: "Wrap every shoot on schedule and on budget.",
    description:
      "Break down scripts, build stripboards, and send call sheets from one timeline.",
    href: "/film-production",
    cta: "Explore Film Production",
    icon: Clapperboard,
    links: [
      { label: "AI Script Breakdown", href: "/film-production/script-breakdown" },
      { label: "Scheduling & Budgeting", href: "/film-production/scheduling-budgeting" },
      { label: "Digital Call Sheets", href: "/film-production/call-sheets" },
    ],
  },
  {
    overline: "CREATIVE OPERATIONS",
    title: "From brief to booked in minutes.",
    description:
      "Turn briefs into scoped projects and staff them without conflicts.",
    href: "/agency",
    cta: "Explore Creative Ops",
    icon: Users,
    links: [
      { label: "Client Intake", href: "/agency/client-intake" },
      { label: "Smart Scheduling", href: "/agency/smart-scheduling" },
      { label: "Client Portals", href: "/agency/client-portal" },
    ],
  },
  {
    overline: "INTELLIGENCE",
    title: "Every project makes the next one more profitable.",
    description:
      "The Production Brain learns from every project to sharpen estimates and staffing.",
    href: "/intelligence",
    cta: "Explore Intelligence",
    icon: BrainCircuit,
    links: [
      { label: "ABRAM Core AI", href: "/intelligence/brain" },
      { label: "Brief Intelligence", href: "/intelligence/brief-intelligence" },
      { label: "ROI Calculator", href: "/intelligence" },
    ],
  },
];

export default function ExploreSection() {
  return (
    <section className="relative w-full py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-14 md:mb-20"
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
            THE PLATFORM
          </span>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight">
            Deliver more projects with the team you have.
          </h2>
          <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
            One system for crew, calendars, and budgets, in sync from brief to wrap.
          </p>
        </motion.div>

        {/* Suite cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUITES.map((suite, idx) => {
            const Icon = suite.icon;
            return (
              <motion.div
                key={suite.overline}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px", amount: 0.1 }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-7 md:p-8 hover:border-white/10 hover:bg-zinc-900/30 transition-colors transition-shadow duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transform-gpu"
              >
                {/* Viewfinder brackets */}
                <div className="absolute top-0 left-0 w-[6px] h-[6px] border-l border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
                <div className="absolute top-0 right-0 w-[6px] h-[6px] border-r border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 w-[6px] h-[6px] border-l border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />
                <div className="absolute bottom-0 right-0 w-[6px] h-[6px] border-r border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />

                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/5 bg-white/[0.03]">
                    <Icon className="w-4 h-4 text-zinc-300" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
                    {suite.overline}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-medium tracking-tight text-white leading-snug">
                  {suite.title}
                </h3>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {suite.description}
                </p>

                {/* Feature links */}
                <ul className="mt-6 space-y-1 border-t border-white/5 pt-5">
                  {suite.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between py-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Hub CTA */}
                <div className="mt-auto pt-6">
                  <Link
                    href={suite.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200"
                  >
                    {suite.cta}
                    <ArrowUpRight className="w-4 h-4 opacity-60" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
