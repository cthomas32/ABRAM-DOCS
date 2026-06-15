"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";
import PrevNextNav from "./PrevNextNav";
import SearchModal from "./SearchModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-black text-foreground flex flex-col font-sans selection:bg-neutral-800 selection:text-white premium-glow-bg">
      {/* Global Navigation Header */}
      <Navbar 
        onSearchClick={() => setSearchOpen(true)} 
        onMenuClick={isDocsPage ? () => setSidebarOpen(true) : undefined}
      />

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-8xl flex-1 pt-16 justify-center px-4 sm:px-6 lg:px-8 gap-8 lg:gap-12">
        {isDocsPage && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}
        {/* Content Container - No Sidebar, centered max-w for reading */}
        <main className="flex-1 flex flex-col min-w-0 w-full">
          <div className="flex-1 flex flex-col">
            
            {/* Animated Page Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex-1 w-full mx-auto p-6 md:p-8 lg:p-12 ${
                  isLandingPage ? "max-w-7xl" : isDocsPage ? "max-w-6xl" : "max-w-4xl"
                }`}
              >
                {/* Breadcrumbs */}
                {isDocsPage && <Breadcrumbs />}

                {/* Dynamic Page Content */}
                <div className="flex-1">
                  {children}
                </div>

                {/* Prev / Next Navigation buttons */}
                {isDocsPage && <PrevNextNav />}
              </motion.div>
            </AnimatePresence>

            {/* Layout Footer */}
            <footer className="w-full mt-auto bg-black/50 backdrop-blur-[20px] border-t border-white/8 py-6">
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
                    ABRAM
                  </a>
                  <a href="https://github.com/cthomas32/ABRAM-DOCS" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">
                    Repository
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
