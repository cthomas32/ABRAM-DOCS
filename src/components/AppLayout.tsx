"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";
import PrevNextNav from "./PrevNextNav";
import SearchModal from "./SearchModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isLandingPage = pathname === "/";
  const isDocsPage = pathname.startsWith("/docs");

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

  return (
    <div className="min-h-screen bg-background-base text-foreground flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Global Navigation Header */}
      <Navbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onSearchClick={() => setSearchOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        
        {/* Sidebar - only shown on docs pages */}
        {isDocsPage && (
          <>
            {/* Backdrop for mobile */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </>
        )}

        {/* Content Container */}
        <main
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isDocsPage ? "lg:pl-64" : ""
          }`}
        >
          {/* Main Content Card Wrapper */}
          <div className="flex-1 flex flex-col">
            
            {/* Content Inner Card (Ceramic Future look) */}
            <div className={`flex-1 w-full mx-auto p-6 md:p-8 lg:p-12 ${
              isLandingPage ? "max-w-7xl" : "max-w-4xl"
            }`}>
              
              {/* Breadcrumbs */}
              {isDocsPage && <Breadcrumbs />}

              {/* Dynamic Page Content */}
              <div className="flex-1">
                {children}
              </div>

              {/* Prev / Next Navigation buttons */}
              {isDocsPage && <PrevNextNav />}
            </div>

            {/* Layout Footer */}
            <footer className="w-full mt-auto glass-nav border-t border-border py-6">
              <div className="max-w-8xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-400">ABRAM</span>
                  <span>© {new Date().getFullYear()} ABRAM. All rights reserved.</span>
                </div>
                
                <div className="flex items-center gap-6">
                  <a href="https://abram.network" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">
                    Home
                  </a>
                  <a href="https://app.abram.network" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">
                    Console
                  </a>
                  <a href="https://github.com/cthomas32/ABRAM-DOCS" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">
                    GitHub
                  </a>
                </div>
              </div>
            </footer>

          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
