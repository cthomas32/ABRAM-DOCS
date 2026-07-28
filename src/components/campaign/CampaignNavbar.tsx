"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Minimal header for the conversion pages under /start.
 *
 * These pages have a single job, so the header carries no navigation and
 * no second call to action that could pull a visitor away from the one on
 * the page. The logo is the only control, and it goes home.
 */
export default function CampaignNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full flex items-center bg-black/50 backdrop-blur-[20px] border-b border-white/8">
      <div className="mx-auto flex h-full w-full max-w-[90rem] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          title="ABRAM Network Home"
          className="flex h-11 items-center outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 rounded-md"
        >
          <Image
            src="/abram-logo-lockup-cream.png"
            alt="ABRAM"
            width={110}
            height={22}
            priority
            className="h-5.5 w-auto block select-none"
          />
        </Link>
      </div>
    </header>
  );
}
