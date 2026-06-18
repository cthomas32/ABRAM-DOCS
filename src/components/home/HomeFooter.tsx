import Link from "next/link";
import Image from "next/image";

export default function HomeFooter() {
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/[0.08] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-sm text-zinc-400">
        {/* Column 1: Logo and description */}
        <div className="space-y-4">
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

        {/* Column 2: Platform */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-xs font-medium tracking-wide text-white">Platform</h4>
          <Link href="/" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Home
          </Link>
          <Link href="/production-brain" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Brain
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

        {/* Column 3: Resources */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-xs font-medium tracking-wide text-white">Resources</h4>
          <Link href="/docs" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Learn
          </Link>
          <Link href="/blog" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Blog
          </Link>
          <Link href="/changelog" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
            Changelog
          </Link>
        </div>

        {/* Column 4: Legal & Copyright */}
        <div className="flex flex-col space-y-3 justify-between min-h-[120px] md:min-h-0">
          <div className="space-y-3">
            <h4 className="text-xs font-medium tracking-wide text-white">Legal</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/privacy-policy" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="text-zinc-400 hover:text-abram-accent transition-colors duration-200 text-xs w-fit">
                Terms of Use
              </Link>
            </div>
          </div>
          {/* Subtext / Helper: text-[10px] */}
          <div className="text-[10px] text-white/25 pt-4 md:pt-0 font-light tracking-widest">
            ©2026 ABRAM Network
          </div>
        </div>
      </div>

      {/* Trademark Disclaimer */}
      <div className="max-w-8xl mx-auto mt-12 pt-6 border-t border-white/[0.04]">
        <p className="text-[10px] text-zinc-600 leading-relaxed font-light">
          Disclaimer: All third-party trademarks, brand names, and logos mentioned in these documents, templates, and mockups (including Netflix, A24, Sony, RED, Dolby, Spotify, and Helix) are the property of their respective owners. Reference to these trademarks is for illustrative and demo purposes only, and does not imply any affiliation with, endorsement by, or sponsorship from the respective trademark holders.
        </p>
      </div>
    </footer>
  );
}
