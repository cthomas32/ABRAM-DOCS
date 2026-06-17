"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

export default function MobileMenu({ isOpen, onClose, pathname }: MobileMenuProps) {
  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const panelVariants: Variants = {
    closed: {
      y: "-100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      },
    },
    open: {
      y: 0,
      transition: {
        type: "tween",
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const menuLinks = [
    { name: "Home", href: "/" },
    { name: "Docs", href: "/docs" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-hidden pointer-events-none flex flex-col justify-start sm:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Slide-down Panel */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
            className="relative w-full bg-zinc-950/95 backdrop-blur-[20px] border-b border-white/8 shadow-2xl pointer-events-auto flex flex-col px-6 py-8 md:px-8 max-h-full overflow-y-auto"
          >
            <div className="w-full max-w-md mx-auto">
              <nav className="flex flex-col gap-2.5">
                {menuLinks.map((link) => {
                  const isActive = 
                    link.href === "/" 
                      ? pathname === "/" 
                      : pathname.startsWith(link.href);

                  return (
                    <motion.div key={link.name} variants={itemVariants}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center rounded-xl border px-4 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                          isActive
                            ? "bg-white/5 border-white/10 text-white shadow-md shadow-white/5"
                            : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02] hover:border-white/5"
                        }`}
                      >
                        <span className="font-sans">{link.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
