import Link from "next/link";
import { ArrowRight, Compass, Shield, Zap, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 py-8 md:py-12">
      {/* Hero Header Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] bg-abram-purple/10 border border-abram-purple/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          Documentation Portal
        </div>
        
        <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-neutral-100 leading-tight">
          Help center
        </h1>
        
        <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Explore configuration guides, workspace policies, and platform operations for managing teams, project intake, resource scheduling, and integrated financial flows.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/docs/user-guide/0.0-agent-and-human-navigation-guide"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-neutral-200 transition-all duration-200 shadow-md shadow-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900/40 border border-border px-6 py-3 text-sm font-semibold text-neutral-300 hover:bg-white/5 hover:text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-neutral-700"
          >
            ABRAM App
          </a>
        </div>
      </section>

      {/* Grid of Main Categories - Style with beautiful glass grids, clean borders, and premium typography */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {[
          {
            title: "Getting Started & Team",
            desc: "Learn how to onboard workspace members, configure organization profiles, set up custom forms, and manage granular team permissions.",
            link: "/docs/user-guide/1.1-signing-in-and-onboarding",
            tag: "Setup & Team",
            tagStyle: "bg-abram-info/10 text-sky-300 border-abram-info/20",
          },
          {
            title: "Project Intake & Scoping",
            desc: "Explore the AI brief analyzer, configure custom client-facing intake forms, and initiate automated project scopes.",
            link: "/docs/user-guide/2.1-ai-brief-analyzer",
            tag: "Intake & Scoping",
            tagStyle: "bg-abram-purple/10 text-purple-300 border-abram-purple/20",
          },
          {
            title: "Projects & Scheduling",
            desc: "Manage master project boards, configure work packages, define work agreements, and coordinate utilization calendars.",
            link: "/docs/user-guide/3.1-master-project-detail-overview",
            tag: "Project Operations",
            tagStyle: "bg-abram-warning/10 text-orange-300 border-abram-warning/20",
          },
          {
            title: "Payments & Financials",
            desc: "Set up integrated Stripe accounts, manage payouts, configure segregated billing ledgers, and track platform credits.",
            link: "/docs/user-guide/5.1-freelancer-stripe-setup",
            tag: "Financial Systems",
            tagStyle: "bg-abram-success/10 text-emerald-300 border-abram-success/20",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="group relative flex flex-col justify-between rounded-2xl glass-panel glass-panel-hover p-6"
          >
            <div className="space-y-4">
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[10px] border ${card.tagStyle}`}>
                {card.tag}
              </span>
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-neutral-200">
                {card.title}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {card.desc}
              </p>
            </div>
            
            <div className="pt-6">
              <Link
                href={card.link}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-white transition-all group-hover:translate-x-0.5"
              >
                Read documentation
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Trustless Financials & AI scoping info section */}
      <section className="rounded-2xl glass-panel p-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-abram-success">
            <Shield className="h-4 w-4" />
            Security & Trust
          </div>
          <h2 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wide text-neutral-100">
            Trustless Ledger Model
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every workspace agreement initialized on ABRAM utilizes a segregated billing ledger. Project milestones are funded and safely secured on-platform. When the agreed work packages are completed and validated by the platform, payments are automatically released.
          </p>
          <div className="pt-2">
            <Link
              href="/docs/user-guide/0.2-order-of-operations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:underline"
            >
              Learn more about ledger security
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/5 bg-neutral-900/30 p-5 space-y-2">
            <Zap className="h-4 w-4 text-abram-purple" />
            <h4 className="text-sm font-semibold text-neutral-200">AI Scoping</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Auto-generate work packages and milestone structures from project briefs.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-neutral-900/30 p-5 space-y-2">
            <Compass className="h-4 w-4 text-abram-info" />
            <h4 className="text-sm font-semibold text-neutral-200">Express Payouts</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Stripe Express integration automatically routes funds to workspace members in under 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
