import Link from "next/link";
import Image from "next/image";

export default function HomeFooter({
  onCookieSettingsClick,
}: {
  onCookieSettingsClick?: () => void;
}) {
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/[0.08] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 md:gap-12 text-sm text-zinc-400">
        {/* Column 1: Logo, description & Copyright */}
        <div className="flex flex-col justify-between space-y-4 col-span-2 sm:col-span-3 md:col-span-1">
          <div className="space-y-3">
            <Link href="/" className="inline-block">
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
              The private intelligence platform for creative production.
            </p>
          </div>
          <div className="text-[10px] text-white/20 font-light tracking-widest pt-2 sm:pt-4">
            ©2026 ABRAM Network
          </div>
        </div>

        {/* Column 2: Film Production */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Film Production</h4>
          <Link href="/film-production" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Overview Hub
          </Link>
          <Link href="/film-production/script-breakdown" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Script Breakdown
          </Link>
          <Link href="/film-production/scheduling-budgeting" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Scheduling & Budgeting
          </Link>
          <Link href="/film-production/call-sheets" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Digital Call Sheets
          </Link>
        </div>

        {/* Column 3: Creative Operations */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Creative Ops</h4>
          <Link href="/agency" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Overview Hub
          </Link>
          <Link href="/agency/client-intake" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Client Intake
          </Link>
          <Link href="/agency/crew-roster" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Crew Roster
          </Link>
          <Link href="/agency/smart-scheduling" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Smart Scheduling
          </Link>
        </div>

        {/* Column 4: Intelligence */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Intelligence</h4>
          <Link href="/intelligence/creative-copilot" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            ABRAM
          </Link>
          <Link href="/intelligence" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            ROI Engine
          </Link>
          <Link href="/intelligence/brain" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Production Brain
          </Link>
          <Link href="/intelligence/brief-intelligence" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Brief Intelligence
          </Link>
          <Link href="/intelligence/crew-matchmaking" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Crew Matchmaking
          </Link>
        </div>

        {/* Column 5: Platform */}
        <div className="flex flex-col space-y-2 col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Platform</h4>
          <Link href="/" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Home
          </Link>
          <Link href="/intelligence" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Intelligence
          </Link>
          <Link href="/pricing" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Pricing
          </Link>
          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit"
          >
            Sign Up
          </a>
        </div>

        {/* Column 5: Resources & Legal */}
        <div className="flex flex-col space-y-2 col-span-2 sm:col-span-1">
          <h4 className="text-xs font-semibold tracking-wide text-white mb-1">Resources & Legal</h4>
          <Link href="/docs" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Help Guides
          </Link>
          <Link href="/blog" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Blog
          </Link>
          <Link href="/changelog" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Changelog
          </Link>
          <Link href="/privacy-policy" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit pt-1.5 border-t border-white/[0.04] mt-1 w-full">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Terms of Use
          </Link>
          <Link href="/acceptable-use-policy" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Acceptable Use Policy
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
      <div className="max-w-8xl mx-auto mt-8 pt-4 border-t border-white/[0.04]">
        <p className="text-[9px] text-zinc-600/80 leading-relaxed font-light">
          Disclaimer: All third-party trademarks, brand names, labor union names, and logos mentioned on this website, in the documentation, or within templates, mockups, and platform descriptions (including SAG-AFTRA, Frame.io, Slack, ARRI, RED, Sony, Cooke, Sennheiser, and other equipment manufacturers, guilds, or associations, as well as fictitious brands such as Nebula, Onyx, Vortex, Helix, Sensa, Aura, and Spire) are the property of their respective owners. ABRAM is an independent platform and is not affiliated with, endorsed by, or sponsored by Screen Actors Guild-American Federation of Television and Radio Artists (SAG-AFTRA), Adobe Inc., Slack Technologies, LLC, Salesforce, Inc., or any other respective trademark or labor organization holders. Reference to these trademarks, unions, or rules is for illustrative, reference, and integration demo purposes only. Any compliance indicators, flags, or features (such as those representing SAG-AFTRA rules or rest periods) are provided solely for informational and user-organizational purposes and do not constitute legal or union-binding representation. Certain features, services, and integrations depicted in templates, mockups, or platform descriptions may be under active development, in beta, or designated as coming soon. We reserve the right to modify, suspend, or discontinue any feature at any time without notice. All interactive tools, sandboxes, and demos presented on this site are fictitious, do not represent a 1-for-1 experience of the actual ABRAM application, and are provided solely for demonstration purposes.
        </p>
      </div>
    </footer>
  );
}
