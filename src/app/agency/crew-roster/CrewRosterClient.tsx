"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Sliders, 
  Send,
  Award
} from "lucide-react";
import AgencyRosterMockup from "@/components/agency/AgencyRosterMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function CrewRosterClient() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://abram.network/agency/crew-roster#webpage",
        "name": "ABRAM Crew & Assets Roster Optimization",
        "description": "Talent matching index and crew database organization in the ABRAM creative production platform.",
        "url": "https://abram.network/agency/crew-roster",
        "isPartOf": { "@id": "https://abram.network/#website" },
        "publisher": { "@id": "https://abram.network/#organization" },
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "ABRAM Crew Matchmaking",
          "applicationCategory": "BusinessApplication",
          "featureList": [
            "AI-Assisted Roster Suggestions",
            "Unified Gear & Personnel Asset Directory",
            "Manual Shortlist Selection Review",
            "One-Click Portal Broadcast Dispatch"
          ]
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://abram.network/agency/crew-roster#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://abram.network/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Creative Agency",
            "item": "https://abram.network/agency"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Crew Roster",
            "item": "https://abram.network/agency/crew-roster"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 select-none relative z-10 isolate">
        {/* Absolute Ambient Page Glows */}
        <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.01] rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Navigation & Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
          <Link 
            href="/agency" 
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-sans font-semibold uppercase min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to agency hub
          </Link>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4 max-w-3xl"
          >
            <motion.span 
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block"
            >
              Crew & Assets Directory
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Staff your next project faster from the crew you already trust.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Filter by department and get AI-assisted roster suggestions ranked by fit.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Playground */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <AgencyRosterMockup />
          </div>
        </section>

        {/* Features deep dive */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Award className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Suitability Scoring</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Crew Matchmaking scores candidates by skill match, ratings, and rate.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Users className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Unified Asset Directory</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Manage contractors, staff, gear, and studio spaces in one secure directory.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Send className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">One-Click Dispatch</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Lock shortlists and dispatch invitations instantly to crew via text.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}
