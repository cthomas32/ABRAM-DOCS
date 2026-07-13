"use client";

import React from "react";
import { 
  Lock, 
  FileCheck, 
  MessageSquare, 
  Coins, 
  ArrowRight 
} from "lucide-react";
import Link from "next/link";
import AgencyClientPortalMockup from "@/components/agency/AgencyClientPortalMockup";

export default function ClientPortalSection() {
  const features = [
    {
      icon: Lock,
      title: "Secure Portal Access",
      description: "Cryptographically unique links with optional passcode verification—no passwords required for clients."
    },
    {
      icon: FileCheck,
      title: "Real-Time Approvals",
      description: "Clients review and sign off on deliverables, track revision histories, and view progress directly."
    },
    {
      icon: MessageSquare,
      title: "Threaded Feedback",
      description: "Centralize conversation feeds on specific assets, preventing scattered email chains and missed updates."
    },
    {
      icon: Coins,
      title: "Integrated Payments",
      description: "Review estimates, accept quotes, and pay project invoices online via secure Stripe Connect routing."
    }
  ];

  return (
    <section className="relative py-16 md:py-24 lg:py-32 border-t border-white/5 bg-transparent overflow-hidden">
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-zinc-800/[0.03] rounded-full filter blur-[80px] lg:blur-[130px] pointer-events-none" 
      />
      <div 
        className="absolute top-1/4 right-1/4 w-[250px] h-[250px] lg:w-[450px] lg:h-[450px] bg-white/[0.008] rounded-full filter blur-[90px] lg:blur-[110px] pointer-events-none" 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          {/* Overline Badge */}
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
            CLIENT EXPERIENCE
          </span>

          {/* Header */}
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-50 uppercase font-display leading-tight">
            Branded Client Portals.
          </h2>

          {/* Description */}
          <p className="mt-4 text-sm md:text-base font-normal leading-7 text-zinc-400 font-sans">
            Provide clients with interactive dashboards scoped to their projects. Share real-time timelines, approve deliverables, comment on drafts, and process payments securely in a single, branded hub.
          </p>

          {/* CTA */}
          <div className="pt-6 flex justify-center">
            <Link 
              href="/agency/client-portal"
              className="btn-glass px-5 py-2.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all duration-200 min-h-[44px] group"
            >
              <span>Explore Client Portal</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Graphic Side */}
        <div className="w-full mb-16">
          <AgencyClientPortalMockup />
        </div>

        {/* 4 Bottom Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-16 border-t border-white/5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col space-y-4 p-6 rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/12 hover:bg-zinc-900/30 transition-all duration-200 select-none group"
              >
                <div className="text-zinc-400 group-hover:text-zinc-100 transition-colors duration-200">
                  <Icon className="h-5 w-5 stroke-[1.4]" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 tracking-tight font-sans">
                  {feature.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-zinc-400 font-sans">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
