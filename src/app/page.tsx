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
        
        <h1 className="font-heading text-3xl md:text-5xl font-black uppercase tracking-wide text-neutral-100 leading-tight">
          ABRAM Documentation
        </h1>
        
        <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Explore configuration guides, API references, and workflow policies for managing clients, contractor talent networks, and studio operations on the ABRAM platform.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/docs/introduction"
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
            Go to Console
          </a>
        </div>
      </section>

      {/* Grid of Main Categories */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Clients",
            desc: "Learn to fund ledgers, manage milestones, invite agencies, and validation flows for deliverables.",
            link: "/docs/clients/overview",
            tag: "Workspace Config",
            tagStyle: "bg-abram-info/10 text-sky-300 border-abram-info/20",
          },
          {
            title: "Contractors",
            desc: "Set up Stripe Connect, complete ID verification, sync calendars, and manage payouts.",
            link: "/docs/contractors/overview",
            tag: "Talent Guides",
            tagStyle: "bg-abram-purple/10 text-purple-300 border-abram-purple/20",
          },
          {
            title: "Orgs & Studios",
            desc: "Configure teams, manage roles and permissions, utilize brief analysis, and coordinate agency packages.",
            link: "/docs/orgs/overview",
            tag: "Studio Management",
            tagStyle: "bg-abram-warning/10 text-orange-300 border-abram-warning/20",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="group relative flex flex-col justify-between rounded-[1rem] bg-neutral-900/20 border border-border p-6 hover:bg-neutral-900/40 hover:border-neutral-700/60 transition-all duration-300"
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-white group-hover:translate-x-0.5 transition-all"
              >
                Read documentation
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Trustless Financials & AI scoping info section */}
      <section className="rounded-[1rem] bg-neutral-900/10 border border-border/80 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-abram-success">
            <Shield className="h-4 w-4" />
            Security & Trust
          </div>
          <h2 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wide text-neutral-100">
            Trustless Ledger Model
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every workspace agreement initialized on ABRAM utilizes a segregated billing ledger. Invoices are funded by the client and safely locked on-platform. When a contractor achieves an agreed milestone, checkpoint review is validated by our system, releasing payments immediately.
          </p>
          <div className="pt-2">
            <Link
              href="/docs/introduction/order-of-operations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:underline"
            >
              Learn more about ledger security
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[1rem] border border-border bg-neutral-900/30 p-5 space-y-2">
            <Zap className="h-4 w-4 text-abram-purple" />
            <h4 className="text-sm font-semibold text-neutral-200">AI Scoping</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Auto-generate work packages and legal milestone structures from loose briefs.
            </p>
          </div>
          <div className="rounded-[1rem] border border-border bg-neutral-900/30 p-5 space-y-2">
            <Compass className="h-4 w-4 text-abram-info" />
            <h4 className="text-sm font-semibold text-neutral-200">Express Payouts</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Stripe Express Connect automatically routes funds to talent in under 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
