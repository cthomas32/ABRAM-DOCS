"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollConnectorLineProps {
  height?: number; // Visual path height in pixels
  gradientId: string;
}

export default function ScrollConnectorLine({ height = 140, gradientId }: ScrollConnectorLineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress as the line travels through the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Interpolate scroll progress to draw the gradient stroke
  const pathLength = useTransform(scrollYProgress, [0.1, 0.75], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.8, 0.9], [0, 1, 1, 0]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full flex justify-center overflow-visible pointer-events-none select-none z-20"
      style={{ height: `${height}px` }}
    >
      <svg 
        width="2" 
        height={height} 
        viewBox={`0 0 2 ${height}`} 
        fill="none" 
        className="h-full w-[2px]"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ECAFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8ECAFF" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Inactive background track */}
        <line 
          x1="1" 
          y1="0" 
          x2="1" 
          y2={height} 
          stroke="rgba(255, 255, 255, 0.06)" 
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Animated active gradient line */}
        <motion.path 
          d={`M 1 0 L 1 ${height}`}
          stroke={`url(#${gradientId})`} 
          strokeWidth="1.5"
          style={{ 
            pathLength,
            opacity
          }}
        />
      </svg>
    </div>
  );
}
