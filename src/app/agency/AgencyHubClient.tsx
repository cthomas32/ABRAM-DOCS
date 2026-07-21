"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { WorkloadPreview } from "@/components/agency/WorkloadBalancerMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

type Step = {
  index: string;
  overline: string;
  heading: string;
  body: string;
  href: string;
  linkLabel: string;
  visual: React.ReactNode;
};

/* Compact micro label used inside preview panels. */
function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-zinc-500 font-sans">
      {children}
    </span>
  );
}

/* Near-black glass preview panel matching the design system. */
function PreviewPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-md shadow-xl p-5 md:p-6 select-none">
      {children}
    </div>
  );
}

/* ---- Step 01 · Brief Intelligence intake preview ---- */
function IntakePreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Incoming Brief</MicroLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
          <AbramMark size={12} />
          Brief Intelligence
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 mb-4">
        <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">
          Need a 60 second brand film plus three social cutdowns delivered in 4K
          for the Helix spring launch, six week turnaround.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { k: "Deliverables", v: "4 assets" },
          { k: "Format", v: "4K + Social" },
          { k: "Timeline", v: "6 weeks" },
          { k: "Estimated Scope", v: "182 hrs" },
        ].map((row) => (
          <div
            key={row.k}
            className="rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2.5"
          >
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans mb-0.5">
              {row.k}
            </div>
            <div className="text-xs font-medium text-zinc-100 font-sans truncate">
              {row.v}
            </div>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 02 · Roster suggestions preview ---- */
function RosterPreview() {
  const people = [
    { name: "Vesper Lin", role: "3D Motion Lead", rate: "$700/d", match: "Strong Match", status: "Available" },
    { name: "Emma Helix", role: "Concept Lead", rate: "$500/d", match: "Strong Match", status: "Available" },
    { name: "Leo Vance", role: "Lead Editor", rate: "$600/d", match: "Good Fit", status: "On Hold" },
  ];
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Suggested Crew</MicroLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
          <AbramMark size={12} />
          Crew Matchmaking
        </span>
      </div>

      <div className="space-y-2.5">
        {people.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-100 font-sans truncate">
                {p.name}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans truncate">
                {p.role} · {p.rate}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-zinc-300 font-sans">{p.match}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans ${
                  p.status === "Available"
                    ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-300 bg-amber-500/10 border-amber-500/20"
                }`}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 03 · Conflict resolution calendar preview ---- */
function SchedulingPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Week 3 Timeline</MicroLabel>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
          <AbramMark size={12} />
          Conflict Resolution
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {days.map((d, i) => (
          <div key={d} className="flex flex-col gap-1">
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans text-center">
              {d}
            </div>
            <div
              className={`h-9 rounded-md border ${
                i === 2
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : "border-white/[0.06] bg-zinc-900/40"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
        <div className="text-[10px] font-medium text-emerald-300 font-sans mb-0.5">
          Wednesday overlap resolved
        </div>
        <div className="text-[10px] text-zinc-400 font-sans">
          Vesper Lin moved to Thursday with rest window preserved.
        </div>
      </div>
    </PreviewPanel>
  );
}

/* ---- Step 04 · Branded client portal preview ---- */
function PortalPreview() {
  const deliverables = [
    { name: "Brand Film Cut", state: "Approved" },
    { name: "Social 9:16", state: "Approved" },
    { name: "Behind the Scenes", state: "In Review" },
  ];
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between mb-4">
        <MicroLabel>Helix Brand Portal</MicroLabel>
        <span className="text-[10px] text-emerald-300 font-sans font-semibold">65% Done</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div className="h-full w-[65%] rounded-full bg-white" />
      </div>

      <div className="space-y-2 mb-4">
        {deliverables.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2"
          >
            <span className="text-xs text-zinc-200 font-sans truncate">{d.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans shrink-0 ${
                d.state === "Approved"
                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                  : "text-zinc-400 bg-white/[0.03] border-white/[0.08]"
              }`}
            >
              {d.state}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-sans">
            Invoice #HX-204
          </div>
          <div className="text-xs font-medium text-zinc-100 font-sans">$12,400</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-sans shrink-0">
          Paid
        </span>
      </div>
    </PreviewPanel>
  );
}

export default function AgencyHubClient() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ABRAM Creative Operations Hub",
    "description": "Creative operations and studio logistics management in the ABRAM creative production platform.",
    "url": "https://abram.network/agency",
    "isPartOf": { "@id": "https://abram.network/#website" },
    "publisher": { "@id": "https://abram.network/#organization" },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "ABRAM Creative Operations",
      "applicationCategory": "BusinessApplication",
      "featureList": [
        "Brief Intelligence Intake Wizard",
        "AI-Assisted Crew Matchmaking",
        "Multi-Day Timeline Resource Scheduling",
        "Union Turnaround Margin Verification",
        "Real-Time Schedule Overlap Resolution"
      ]
    }
  };

  const steps: Step[] = [
    {
      index: "01",
      overline: "Intake the Brief",
      heading: "Every client brief becomes a scoped project the moment it lands.",
      body: "Brief Intelligence reads the request, extracts deliverables and formats, and estimates the work scope for you.",
      href: "/agency/client-intake",
      linkLabel: "See Brief Intelligence",
      visual: <IntakePreview />,
    },
    {
      index: "02",
      overline: "Staff from Your Roster",
      heading: "Fill every role with the right people you already work with.",
      body: "Crew Matchmaking offers AI-assisted roster suggestions ranked by fit, rate, and current availability.",
      href: "/agency/crew-roster",
      linkLabel: "Explore the Roster Board",
      visual: <RosterPreview />,
    },
    {
      index: "03",
      overline: "Balance the Workload",
      heading: "See who is overloaded and rebalance the week before it costs you.",
      body: "The Workload Balancer shows planned hours, over-allocation, and unstaffed work across your team on one day-by-day grid.",
      href: "/agency/capacity-planning",
      linkLabel: "Open the Capacity Grid",
      visual: <WorkloadPreview />,
    },
    {
      index: "04",
      overline: "Schedule Without Conflicts",
      heading: "Your schedule fills in around every overlap and rest window automatically.",
      body: "Smart Scheduling catches double-bookings and turnaround margins, then suggests a clean resolution in one click.",
      href: "/agency/smart-scheduling",
      linkLabel: "Open the Timeline Calendar",
      visual: <SchedulingPreview />,
    },
    {
      index: "05",
      overline: "Clients Approve and Pay",
      heading: "Clients track progress, approve deliverables, and settle invoices in one branded portal.",
      body: "Give every client a private space to follow the timeline and pay you the moment work is signed off.",
      href: "/agency/client-portal",
      linkLabel: "Tour the Client Portal",
      visual: <PortalPreview />,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.015] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative w-full min-h-[40vh] md:min-h-[45vh] flex flex-col justify-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-8 md:mb-12">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full"
            >
              <motion.span
                variants={revealVariants}
                custom={0.0}
                className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block"
              >
                Creative Operations Suite
              </motion.span>

              <motion.h1
                variants={revealVariants}
                custom={0.1}
                className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
              >
                Run your studio&apos;s client work without the logistics headache.
              </motion.h1>

              <motion.p
                variants={revealVariants}
                custom={0.2}
                className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto font-sans select-text"
              >
                Turn briefs into scoped projects and staffed schedules in minutes.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Numbered Workflow Story */}
        <div className="flex flex-col gap-20 md:gap-32">
          {steps.map((step, i) => {
            const visualFirst = i % 2 === 1;
            return (
              <section
                key={step.index}
                className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent"
              >
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center"
                  >
                    {/* Copy column */}
                    <motion.div
                      variants={revealVariants}
                      custom={0.0}
                      className={`space-y-4 ${visualFirst ? "md:order-2" : "md:order-1"}`}
                    >
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block">
                        <span className="text-zinc-600 mr-2">{step.index}</span>
                        {step.overline}
                      </span>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-[1.15] font-sans select-text">
                        {step.heading}
                      </h2>
                      <p className="text-sm sm:text-base leading-7 text-zinc-400 max-w-md font-sans select-text">
                        {step.body}
                      </p>
                      <div className="pt-1">
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-200 hover:text-white transition-colors font-sans min-h-[44px]"
                        >
                          <span>{step.linkLabel}</span>
                          <ArrowUpRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                        {step.index === "05" && (
                          <div className="pt-4">
                            <a
                              href="https://app.abram.network"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-glass inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium"
                            >
                              <span>Open ABRAM</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Visual column */}
                    <motion.div
                      variants={revealVariants}
                      custom={0.15}
                      className={visualFirst ? "md:order-1" : "md:order-2"}
                    >
                      {step.visual}
                    </motion.div>
                  </motion.div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
