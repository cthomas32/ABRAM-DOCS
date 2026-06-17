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


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Normalize pathname to strip trailing slashes for matching
  const cleanPathname = pathname ? pathname.replace(/\/$/, "") || "/" : "/";

  // Marketing routes that need clean, un-padded full width presentation
  const isMarketingPage = cleanPathname === "/" || cleanPathname === "/landing" || cleanPathname === "/pricing" || cleanPathname === "/production-brain";
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

  if (isMarketingPage) {
    const isBrainPage = cleanPathname === "/production-brain";
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
        <HomeFooter />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} pathname={cleanPathname} />
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </BackgroundGlow>
    );
  }

  // 2. Documentation / Standard App Layout Rendering
  return (
    <BackgroundGlow variant="premium" className="selection:bg-zinc-800 selection:text-white">
      <Navbar 
        onSearchClick={() => setSearchOpen(true)} 
        onMenuClick={isDocsPage && cleanPathname !== "/docs" ? () => setSidebarOpen(true) : undefined}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 pt-16 justify-center px-4 sm:px-6 lg:px-8 gap-8 lg:gap-12">
        {isDocsPage && cleanPathname !== "/docs" && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onSearchClick={() => setSearchOpen(true)} />
        )}
        <main className="flex-1 flex flex-col min-w-0 w-full">
          <div className="flex-1 flex flex-col">
            <div
              className={`flex-1 w-full mx-auto p-6 md:p-8 lg:p-12 ${
                cleanPathname === "/docs" ? "max-w-7xl" : isDocsPage ? "max-w-6xl" : "max-w-4xl"
              }`}
            >
              {isDocsPage && cleanPathname !== "/docs" && <Breadcrumbs />}

              <div className="flex-1">
                {children}
              </div>

              {isDocsPage && cleanPathname !== "/docs" && <PrevNextNav />}
            </div>

            <HomeFooter />
          </div>
        </main>
      </div>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} pathname={cleanPathname} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </BackgroundGlow>
  );
}
