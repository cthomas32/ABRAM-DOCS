import Link from "next/link";
import Image from "next/image";
import NewsletterSignup from "../NewsletterSignup";

export default function HomeFooter({
  onCookieSettingsClick,
}: {
  onCookieSettingsClick?: () => void;
}) {
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/[0.08] py-8 px-4 sm:px-6 lg:px-8">
      {/* Newsletter Signup Row */}
      <div className="max-w-8xl mx-auto mb-6 pb-6 border-b border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-white uppercase font-sans">Subscribe to updates</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-sm font-sans">
            Receive release logs, workflow templates, and creative intelligence announcements.
          </p>
        </div>
        <div className="w-full">
          <NewsletterSignup variant="inline" className="max-w-md md:ml-auto" />
        </div>
      </div>

      <div className="max-w-8xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 md:gap-12 text-sm text-zinc-400">
        {/* Column 1: Logo, description & Copyright */}
        <div className="flex flex-col justify-between space-y-4 col-span-2 sm:col-span-3 md:col-span-1">
          <div className="space-y-3">
            <Link href="/" title="ABRAM Network Home" className="inline-block">
              <Image
                src="/abram-logo-lockup-cream.png"
                alt="ABRAM"
                width={110}
                height={28}
                className="h-7 w-auto block select-none"
              />
            </Link>
            {/* Subtext: text-[11px] */}
            <p className="text-[11px] text-white/30 max-w-xs leading-relaxed font-light">
              The AI platform for creative intelligence.
            </p>
          </div>
          <div className="text-[10px] text-white/20 font-light tracking-widest pt-2 sm:pt-4">
            ©2026 ABRAM Network
          </div>
        </div>

        {/* Column 2: Film Production */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Film Production</h4>
          <Link href="/film-production" title="Film Production Hub Overview" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Overview Hub
          </Link>
          <Link href="/film-production/script-breakdown" title="AI Script Breakdown & Screenplay Parser" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Script Breakdown
          </Link>
          <Link href="/film-production/scheduling-budgeting" title="Film Production Scheduling & Budgeting" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Scheduling & Budgeting
          </Link>
          <Link href="/film-production/call-sheets" title="Digital Call Sheets & Crew Call Times" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Digital Call Sheets
          </Link>
        </div>

        {/* Column 3: Creative Operations */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Creative Ops</h4>
          <Link href="/agency" title="Creative Operations Hub Overview" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Overview Hub
          </Link>
          <Link href="/agency/client-intake" title="Client Intake Briefs & Requirements" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Client Intake
          </Link>
          <Link href="/agency/crew-roster" title="Crew Roster & Contractor Availability" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Crew Roster
          </Link>
          <Link href="/agency/capacity-planning" title="Workload Balancer & Capacity Planning" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Capacity Planning
          </Link>
          <Link href="/agency/resource-management" title="Resource Management" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Resource Management
          </Link>
          <Link href="/agency/smart-scheduling" title="AI Smart Scheduling & Crew Booking" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Smart Scheduling
          </Link>
          <Link href="/agency/client-portal" title="Secure Client Portal & Branded Dashboards" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Client Portal
          </Link>
        </div>

        {/* Column 4: Intelligence */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Intelligence</h4>
          <Link href="/intelligence/brain" title="ABRAM Core AI" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            ABRAM
          </Link>
          <Link href="/intelligence" title="Intelligence Overview Hub & ROI Calculator" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Overview Hub
          </Link>
          <Link href="/intelligence/brief-intelligence" title="Brief Intelligence" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Brief Intelligence
          </Link>
          <Link href="/intelligence/crew-matchmaking" title="Crew Matchmaking" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Crew Matchmaking
          </Link>
        </div>

        {/* Column 5: Platform */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Platform</h4>
          <Link href="/" title="ABRAM Network Home" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Home
          </Link>
          <Link href="/pricing" title="ABRAM Platform Pricing Plans" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Pricing
          </Link>
          <Link href="/creators" title="ABRAM for Creators and Brand Deals" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Creators
          </Link>
          <Link href="/alternatives" title="ABRAM Platform Alternatives & Comparisons" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Alternatives
          </Link>
          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            title="Sign Up for ABRAM App"
            className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit"
          >
            Sign Up
          </a>
        </div>

        {/* Column 5: Resources & Legal */}
        <div className="flex flex-col space-y-2 col-span-2 sm:col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Resources & Legal</h4>
          <Link href="/docs" title="ABRAM Help Guides & Documentation" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Help Guides
          </Link>
          <Link href="/blog" title="ABRAM Network Blog & Insights" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Blog
          </Link>
          <Link href="/changelog" title="Product Changelog & System Updates" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Changelog
          </Link>
          <Link href="/privacy-policy" title="Privacy Policy" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit pt-1.5 border-t border-white/[0.04] mt-1 w-full">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" title="Terms of Use" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Terms of Use
          </Link>
          <Link href="/acceptable-use-policy" title="Acceptable Use Policy" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Acceptable Use Policy
          </Link>
          <Link href="/accessibility" title="Accessibility Statement" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Accessibility
          </Link>
          <button
            onClick={onCookieSettingsClick}
            type="button"
            className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit text-left cursor-pointer border-t border-white/[0.04] pt-1.5 mt-1 w-full"
          >
            Cookie Settings
          </button>
        </div>
      </div>

      {/* Trademark Disclaimer */}
      <div className="max-w-8xl mx-auto mt-6 pt-4 border-t border-white/[0.04]">
        <p className="text-[9px] text-zinc-600/80 leading-relaxed font-light">
          Disclaimer: All third-party trademarks, product names, and logos referenced on this website are the property of their respective owners. ABRAM is an independent platform and is not affiliated with, endorsed by, or sponsored by any referenced third-party entities, guilds, or trademark holders. Interactive tools, mockups, and feature previews are provided for demonstration purposes only.
        </p>
      </div>
      <div className="max-w-8xl mx-auto mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-600/60 justify-center">
        <Link href="/start" className="hover:text-zinc-400 transition-colors duration-200">Start Free</Link>
        <Link href="/start/agencies" className="hover:text-zinc-400 transition-colors duration-200">For Agencies</Link>
        <Link href="/start/filmmakers" className="hover:text-zinc-400 transition-colors duration-200">For Filmmakers</Link>
        <Link href="/start/post-production" className="hover:text-zinc-400 transition-colors duration-200">Post-Production</Link>
        <Link href="/start/resource-management" className="hover:text-zinc-400 transition-colors duration-200">Resource Management</Link>
        <Link href="/start/ai-assistant" className="hover:text-zinc-400 transition-colors duration-200">AI Assistant</Link>
        <Link href="/links" className="hover:text-zinc-400 transition-colors duration-200">Link Directory</Link>
      </div>
    </footer>
  );
}
