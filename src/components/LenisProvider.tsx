"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function LenisWatcher() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      // Force scroll to top on route change immediately
      lenis.scrollTo(0, { immediate: true });
      
      // Force resize calculation after a small timeout to let the DOM update
      const timer = setTimeout(() => {
        lenis.resize();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, lenis]);

  return null;
}

const LENIS_OPTIONS = {
  lerp: 0.08,        // Lower values make the scrolling smoother/slower
  duration: 1.2,     // Duration of scroll animation
  smoothWheel: true, // Enable smooth scroll on mouse wheel
  wheelMultiplier: 1.0,
};

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted || isAdmin || isMobile) {
    return <>{children}</>;
  }

  return (
    <ReactLenis 
      root 
      options={LENIS_OPTIONS}
    >
      <LenisWatcher />
      {children}
    </ReactLenis>
  );
}

