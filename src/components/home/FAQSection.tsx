"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is ABRAM?",
      answer: (
        <p className="text-zinc-400 text-sm md:text-base leading-7">
          ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. It enables organizations to coordinate crew rosters, manage equipment logistics, perform script breakdowns, process invoices, and parse briefs with private, secure AI-assisted workflow optimization—designed to empower creative professionals, not replace them.
        </p>
      )
    },
    {
      question: "How much does ABRAM cost?",
      answer: (
        <p className="text-zinc-400 text-sm md:text-base leading-7">
          ABRAM offers flexible, usage-based tiers starting with a free option for small teams and independent creators. Paid tiers scale based on seat count, credit consumption (used for AI-assisted brief parsing, script breakdowns, and talent matchmaking), and advanced calendar integrations. For larger studios and enterprise requirements, we offer custom packages with dedicated support and single sign-on (SSO/SCIM).
        </p>
      )
    },
    {
      question: "Is ABRAM affiliated with SAG-AFTRA, DGA, or IATSE?",
      answer: (
        <p className="text-zinc-400 text-sm md:text-base leading-7">
          No. ABRAM is an independent, private software platform and has no official affiliation, sponsorship, endorsement, or partnership with SAG-AFTRA, the Directors Guild of America (DGA), the International Alliance of Theatrical Stage Employees (IATSE), or any other labor unions, guilds, or industry associations. All references to union rules, scheduling rest periods, or compliance parameters within the platform are provided solely for informational and user-organizational purposes, and do not constitute legal or union-binding representation. For full details, please refer to the detailed disclaimers in our footer and our Terms of Use.
        </p>
      )
    },
    {
      question: "How does ABRAM manage film production scheduling and script breakdowns?",
      answer: (
        <p className="text-zinc-400 text-sm md:text-base leading-7">
          ABRAM includes a screenplay parser that reconstructs standard script layouts (sluglines, action blocks, and character cues) from uploaded PDF or FDX files. The system automatically extracts cast, locations, props, wardrobe, VFX, and SFX elements to build digital breakdown sheets. These elements are synced directly with our resource calendar and work orders, enabling teams to schedule shoot days, assign crew, and budget logistics in one unified workspace.
        </p>
      )
    },
    {
      question: "How does ABRAM compare to legacy scheduling software?",
      answer: (
        <p className="text-zinc-400 text-sm md:text-base leading-7">
          Unlike legacy systems like Movie Magic, StudioBinder, or Adobe Workfront, which require teams to jump between separate tools for scheduling, resource allocation, and billing, ABRAM unifies these workflows. We combine AI-assisted script breakdown and brief parsing with live, conflict-free resource scheduling and automated contractor invoicing via Stripe Connect. This eliminates manual data entry and fragmentation across the production lifecycle.
        </p>
      )
    }
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative py-16 md:py-24 lg:py-32 border-t border-white/5 bg-transparent overflow-visible">
      {/* Ambient Glows */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-purple-500/[0.02] rounded-full filter blur-[80px] lg:blur-[130px] pointer-events-none" 
      />
      <div 
        className="absolute top-1/4 left-1/3 w-[250px] h-[250px] lg:w-[450px] lg:h-[450px] bg-[#8ECAFF]/[0.012] rounded-full filter blur-[90px] lg:blur-[110px] pointer-events-none" 
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header Block */}
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 text-[10px] font-semibold tracking-[0.2em] uppercase w-fit">
            FAQS
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-50 uppercase font-display leading-tight">
            Frequently Asked Questions
          </h2>
          
          <p className="text-sm md:text-base font-normal leading-relaxed text-zinc-400 max-w-xl">
            Everything you need to know about the ABRAM production management platform.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md overflow-hidden hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-300 shadow-sm"
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left text-zinc-200 hover:text-white transition-colors duration-200 cursor-pointer outline-none focus-visible:bg-white/[0.02] min-h-[44px]"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans font-medium text-sm md:text-base tracking-tight pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-300 ease-out shrink-0 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {/* Accordion Content Panel */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-white/5 bg-white/[0.01]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
