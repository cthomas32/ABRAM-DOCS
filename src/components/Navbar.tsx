"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X, ArrowUpRight } from "lucide-react";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSearchClick: () => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen, onSearchClick }: NavbarProps) {
  return (
    <header className="fixed top-0 z-40 w-full glass-nav border-b border-border">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Menu Toggle & Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white lg:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 rounded-md">
            <Image
              src="/logo/dark.svg"
              alt="ABRAM logo"
              width={130}
              height={14}
              priority
              className="h-4.5 w-auto block select-none"
            />
            <span className="hidden sm:inline-block text-[10px] font-heading font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-border px-1.5 py-0.5 rounded-[6px]">
              Docs
            </span>
          </Link>
        </div>

        {/* Center Section: Search Bar Placeholder Trigger */}
        <div className="hidden md:flex max-w-md flex-1 px-4 lg:px-12">
          <button
            onClick={onSearchClick}
            className="relative w-full text-left cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-neutral-500 group-hover:text-neutral-400 transition-colors" aria-hidden="true" />
            </div>
            <div className="block w-full rounded-full border border-border bg-neutral-950/40 py-1.5 pl-10 pr-4 text-sm text-neutral-400 group-hover:text-neutral-300 group-hover:border-neutral-700 group-hover:bg-neutral-950 transition-all duration-200 select-none">
              Search documentation...
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="inline-flex items-center rounded border border-border bg-neutral-900 px-1.5 font-sans text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section: External App Link */}
        <div className="flex items-center gap-4">
          {/* Mobile search icon button */}
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer"
            onClick={onSearchClick}
            aria-label="Search documentation"
          >
            <Search className="h-4 w-4" />
          </button>

          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition-all duration-200 shadow-md shadow-white/5 font-sans outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Console
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>
    </header>
  );
}
