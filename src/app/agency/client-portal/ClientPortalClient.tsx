"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Database,
  RefreshCw,
  Zap,
  MessageSquare,
  FileCheck,
  LayoutGrid,
  Layers,
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
            "Secure tokenized link access",
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
              Branded client dashboards, unified and secure.
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-2xl select-text font-sans"
            >
              Replace scattered email chains and expiring file links. ABRAM provides clients with private, interactive portals via secure cryptographic link access—giving them real-time visibility into project status, asset approvals, collaborative feedback, and invoice payments.
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
                  Clients enter their name and email, with optional 6-digit passcode verification, to immediately access their dashboard without passwords.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section (6 cards) */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-50 mb-10 text-center font-sans">
              Designed to look like your product, not a bolted-on tool.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Client Hub</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  A single landing page showing shared projects with live statuses, layout toggles, and zero configuration.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Project Dashboard</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Scoped views covering project timelines, call sheets, schedules, and deliverables.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <FileCheck className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Asset Approvals</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Attributable digital asset reviews, feedback loops, and change tracking per revision.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Collaborative Discussions</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Real-time, contextual message feeds scoped directly to the project or deliverable.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Project Intake</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Embedded brief request forms that let clients submit new jobs directly to your drafts.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="space-y-3 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 transition-all">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Coins className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 font-sans">Integrated Billing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Review estimates, approve quotes, and settle invoices online via secure Stripe Connect integrations.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Security & Access Section */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white w-fit">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
                  Secure Link Access with Optional Verification
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  ABRAM replaces vulnerable, password-based logins with cryptographically unique links and optional multi-factor email verification codes, keeping client portals impenetrable yet frictionless. Access is managed through strict server-side data isolation, visitor activity logging, and instant link rotation to revoke or refresh access instantly.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/30 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[10px] font-sans text-zinc-500 font-bold uppercase tracking-wider">Access Settings</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans">Secure API Gateway</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg">
                    <span className="text-[9px] font-sans text-zinc-500 uppercase block mb-1">Verify Client Email</span>
                    <span className="text-xs text-zinc-300 font-sans">Enabled (Requires 6-digit MFA passcode)</span>
                  </div>
                  <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg">
                    <span className="text-[9px] font-sans text-zinc-500 uppercase block mb-1">Link Expiry Period</span>
                    <span className="text-xs text-zinc-300 font-sans">30 Days (Auto-regenerates token)</span>
                  </div>
                  <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-sans text-zinc-500 uppercase block mb-1">Public Account Creation</span>
                      <span className="text-xs text-zinc-300 font-sans">Disabled (Token-only restriction)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Technical Story Section (Single-Database Workspace Integration) */}
        <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-transparent border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans mb-3">
              The Workspace Sync (The Technical Story)
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto font-sans">
              Unlike traditional snapshot tools that email static PDFs or cache stale spreadsheets, Abram's Client Portal integrates directly into your live production workspace database.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            {/* Direct write */}
            <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-900/10 hover:border-white/10 transition-all flex flex-col items-center sm:items-start">
              <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white shrink-0 w-fit">
                <Database className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-zinc-200 font-sans">Zero-Sync Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Portal views query the live database in real-time, eliminating the need for sync pipelines, file exports, or stale snapshots.
                </p>
              </div>
            </div>

            {/* Always live */}
            <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-900/10 hover:border-white/10 transition-all flex flex-col items-center sm:items-start">
              <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white shrink-0 w-fit">
                <Zap className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-zinc-200 font-sans">Two-Way Reactivity</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Client approvals, comment updates, and project intake requests instantly populate on your internal dashboard.
                </p>
              </div>
            </div>

            {/* Gateway protection */}
            <div className="space-y-3 p-5 rounded-xl border border-white/5 bg-zinc-900/10 hover:border-white/10 transition-all flex flex-col items-center sm:items-start">
              <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-white shrink-0 w-fit">
                <RefreshCw className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-zinc-200 font-sans">Isolated Trust Boundaries</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  A dedicated server-side gateway intercepts all portal requests, strictly restricting database queries to the client's token-scoped records.
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
