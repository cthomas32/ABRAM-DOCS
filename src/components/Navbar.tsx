"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, PanelLeft, Search, X } from "lucide-react";

interface NavbarProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Navbar({ onSearchClick, onMenuClick, mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const isMarketingPage = pathname === "/" || pathname === "/landing";
  const [isVisible, setIsVisible] = useState(!isMarketingPage);

  useEffect(() => {
    if (!isMarketingPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const heroThreshold = window.innerHeight - 80;
      if (window.scrollY >= heroThreshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMarketingPage]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 w-full flex items-center bg-black/50 backdrop-blur-[20px] border-b border-white/8 transition-all duration-500 ease-in-out ${
        isVisible 
          ? "opacity-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Logo & Mobile Sidebar Trigger */}
        <div className="flex items-center gap-4">
          {onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="lg:hidden h-11 w-11 flex items-center justify-center -ml-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden h-11 w-11 flex items-center justify-center -ml-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
          <Link 
            href="/" 
            className="flex h-11 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 rounded-md ml-1 sm:ml-0"
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

        {/* Right Section: External App Button & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/docs"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname.startsWith("/docs")
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hidden sm:inline-flex ${
              pathname === "/pricing"
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            Pricing
          </Link>
          <button
            onClick={onSearchClick}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <a
            href="https://app.abram.network"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold hover:bg-zinc-200 transition-all duration-200 shadow-md shadow-white/5 outline-none focus-visible:ring-2 focus-visible:ring-white hidden xs:inline-flex"
          >
            ABRAM
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>

    </header>
  );
}
