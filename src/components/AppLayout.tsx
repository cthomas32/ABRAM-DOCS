"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";
import PrevNextNav from "./PrevNextNav";
import SearchModal from "./SearchModal";
import HomeFooter from "./home/HomeFooter";
import MobileMenu from "./MobileMenu";
import BackgroundGlow from "./BackgroundGlow";
import dynamic from "next/dynamic";

const CookieConsent = dynamic(() => import("./CookieConsent"), {
  ssr: false,
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  // Normalize pathname to strip trailing slashes for matching
  const cleanPathname = pathname ? pathname.replace(/\/$/, "") || "/" : "/";

  const isAdminPage = cleanPathname.startsWith("/admin");
  // Marketing routes that need clean, un-padded full width presentation
  const isMarketingPage = cleanPathname === "/" || cleanPathname === "/landing" || cleanPathname === "/pricing" || cleanPathname === "/production-brain" || cleanPathname === "/film-production" || cleanPathname.startsWith("/film-production/") || cleanPathname === "/agency" || cleanPathname.startsWith("/agency/") || cleanPathname === "/intelligence" || cleanPathname.startsWith("/intelligence/");
  const isDocsPage = cleanPathname.startsWith("/docs");

  // Keyboard shortcut listener for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isAdminPage) {
    return (
      <div className="selection:bg-zinc-800 selection:text-white bg-[#0A0A0A]">
        {children}
      </div>
    );
  }

  if (isMarketingPage) {
    const isBrainPage = cleanPathname === "/production-brain" || cleanPathname === "/intelligence/brain";
    return (
      <BackgroundGlow 
        variant="premium" 
        techGrid={isBrainPage} 
        grain={isBrainPage} 
        className="selection:bg-zinc-800 selection:text-white"
      >
        <Navbar 
          onSearchClick={() => setSearchOpen(true)} 
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="flex-1 w-full">
          {children}
        </main>
        <HomeFooter onCookieSettingsClick={() => setCookieSettingsOpen(true)} />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} pathname={cleanPathname} />
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <CookieConsent isOpen={cookieSettingsOpen} onClose={() => setCookieSettingsOpen(false)} />
      </BackgroundGlow>
    );
  }

  // 2. Documentation / Standard App Layout Rendering
  const showSidebar = isDocsPage && cleanPathname !== "/docs";

  if (showSidebar) {
    return (
      <BackgroundGlow variant="premium" className="selection:bg-zinc-800 selection:text-white">
        <Navbar 
          onSearchClick={() => setSearchOpen(true)} 
          onMenuClick={() => setSidebarOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="mx-auto flex w-full max-w-[90rem] flex-1 pt-16 justify-center px-4 sm:px-6 lg:px-8 gap-8 lg:gap-12">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onSearchClick={() => setSearchOpen(true)} />
          <main className="flex-1 flex flex-col min-w-0 w-full">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 w-full mx-auto p-6 md:p-8 lg:p-12 max-w-6xl">
                <Breadcrumbs />

                <div className="flex-1">
                  {children}
                </div>

                <PrevNextNav />
              </div>

              <HomeFooter onCookieSettingsClick={() => setCookieSettingsOpen(true)} />
            </div>
          </main>
        </div>

        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} pathname={cleanPathname} />
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <CookieConsent isOpen={cookieSettingsOpen} onClose={() => setCookieSettingsOpen(false)} />
      </BackgroundGlow>
    );
  }

  // 3. Non-docs/non-sidebar layout (for blog, changelog, privacy policy, terms of use, docs main page, etc.)
  const contentMaxWidth = cleanPathname === "/docs" ? "max-w-7xl" : "max-w-4xl";

  return (
    <BackgroundGlow variant="premium" className="selection:bg-zinc-800 selection:text-white">
      <Navbar 
        onSearchClick={() => setSearchOpen(true)} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="flex-1 w-full flex flex-col pt-16">
        <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex-1 w-full mx-auto p-6 md:p-8 lg:p-12 ${contentMaxWidth}`}
          >
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
        <HomeFooter onCookieSettingsClick={() => setCookieSettingsOpen(true)} />
      </main>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} pathname={cleanPathname} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CookieConsent isOpen={cookieSettingsOpen} onClose={() => setCookieSettingsOpen(false)} />
    </BackgroundGlow>
  );
}
