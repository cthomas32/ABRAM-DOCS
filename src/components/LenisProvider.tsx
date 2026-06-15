"use client";

import { ReactLenis } from "lenis/react";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.08,        // Lower values make the scrolling smoother/slower
        duration: 1.2,     // Duration of scroll animation
        smoothWheel: true, // Enable smooth scroll on mouse wheel
        wheelMultiplier: 1.0,
      }}
    >
      {children}
    </ReactLenis>
  );
}
