"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  FileCheck,
  LayoutGrid,
  Coins
} from "lucide-react";
import AgencyClientPortalMockup from "@/components/agency/AgencyClientPortalMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

export default function ClientPortalClient() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://abram.network/agency/client-portal#webpage",
        "name": "ABRAM Client Portal & Branded Dashboards",
        "description": "Secure client portals to track project timelines, approve deliverables, comment on versions, and process invoice payments.",
        "url": "https://abram.network/agency/client-portal",
        "isPartOf": { "@id": "https://abram.network/#website" },
        "publisher": { "@id": "https://abram.network/#organization" },
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "ABRAM Client Portal",
          "applicationCategory": "BusinessApplication",
          "featureList": [
            "Secure unique link access",
            "Interactive timeline & scheduling views",
            "Real-time deliverable approvals",
            "Threaded chat-style feedback",
            "Stripe-integrated online invoice payments"
          ]
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://abram.network/agency/client-portal#breadcrumb",
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
            "name": "Client Portal",
            "item": "https://abram.network/agency/client-portal"
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
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-semibold uppercase min-h-[44px]"
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
              Client Hub & Collaboration
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight font-sans select-text"
            >
              Give clients one branded place to track work, approve it, and pay for it.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Replace email chains with one secure portal for approvals and payments.
            </motion.p>
          </motion.div>
        </div>

        {/* Live Interactive Playground Mockup */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-transparent overflow-visible mb-16 md:mb-24">
          <div className="max-w-7xl mx-auto">
            <AgencyClientPortalMockup />
          </div>
        </section>

        {/* How It Works (3-step flow) */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-10 text-center font-sans">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20">
                <span className="text-[10px] font-sans text-zinc-500 font-bold uppercase tracking-wider block">Step 01</span>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Link Projects</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Selectively associate one or more active project records with a client within your workspace.
                </p>
              </div>

              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20">
                <span className="text-[10px] font-sans text-zinc-500 font-bold uppercase tracking-wider block">Step 02</span>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Secure Link Access</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  ABRAM generates a unique, cryptographically signed portal URL for that client.
                </p>
              </div>

              <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-950/20">
                <span className="text-[10px] font-sans text-zinc-500 font-bold uppercase tracking-wider block">Step 03</span>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Optional Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Clients enter their name and email to access their dashboard instantly, no password needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section (4 cards, security folded in) */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-10 text-center font-sans">
              One branded workspace to track, approve, and pay for client work.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Feature 1 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Client Hub & Project Dashboard</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  A single landing page shows shared projects with live status updates.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <FileCheck className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Approvals & Discussions</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Track asset approvals and real-time feedback for every project or deliverable.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Coins className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Project Intake & Billing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Clients submit requests, approve quotes, and pay invoices online.
                </p>
              </div>

              {/* Feature 4: Security folded in */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Lock className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Secure Link Access</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Unique secure links replace passwords and auto-expire after 30 days.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08] text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
              Try Client Portal with your next project
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-xl mx-auto">
              Client Portal capabilities scale with your subscription: 5 active clients on Solo Pro, 15 on Team, 50 on Studio, and unlimited on Enterprise.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link 
                href="/pricing"
                className="btn-glass px-6 py-2.5 text-xs font-semibold flex items-center gap-1.5 min-h-[44px]"
              >
                <span>View Plan Pricing</span>
              </Link>
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-1.5 min-h-[44px]"
              >
                <span>Try it now</span>
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
