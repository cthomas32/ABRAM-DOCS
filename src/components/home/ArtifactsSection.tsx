"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from "framer-motion";
import { artifactsDemoData } from "@/lib/artifactsDemoData";
import { MockArtifactCanvas } from "./MockArtifactCanvas";
import ScrollDrivenChatbot from "./ScrollDrivenChatbot";

function ProgressBarSegment({
  idx,
  numItems,
  scrollYProgress,
}: {
  idx: number;
  numItems: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = idx / numItems;
  const end = (idx + 1) / numItems;

  const width = useTransform(scrollYProgress, [start, end], ["0%", "100%"]);

  return (
    <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative">
      <motion.div
        style={{ width }}
        className="absolute top-0 left-0 h-full bg-zinc-200 shadow-[0_0_10px_rgba(228,228,231,0.5)]"
      />
    </div>
  );
}

export default function ArtifactsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleFeatureIndex, setVisibleFeatureIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const numItems = artifactsDemoData.length;
    if (numItems === 0) return;
    
    // Calculate the index based on scroll progress (0 to 1)
    let index = Math.floor(latest * numItems);
    // Ensure index is within bounds
    if (index >= numItems) index = numItems - 1;
    if (index < 0) index = 0;
    
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  });

  const activeFeature = artifactsDemoData[activeIndex];
  const visibleFeature = artifactsDemoData[visibleFeatureIndex];

  return (
    <section ref={containerRef} className="relative w-full h-[200vh] md:h-[400vh] bg-abram-black">
      <div className="sticky top-0 min-h-screen w-full flex items-center overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center h-full py-24">
          
          {/* Left Side: Content & Chatbot */}
          <div className="relative h-full w-full flex flex-col justify-center lg:col-span-5 xl:col-span-5 max-w-xl mx-auto lg:mx-0">
            {activeFeature && (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    {artifactsDemoData.map((_, idx) => (
                      <ProgressBarSegment
                        key={idx}
                        idx={idx}
                        numItems={artifactsDemoData.length}
                        scrollYProgress={scrollYProgress}
                      />
                    ))}
                  </div>
                  <h2 className="text-2xl font-medium tracking-tight text-white mb-3">
                    {activeFeature.sectionTitle}
                  </h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {activeFeature.sectionDescription}
                  </p>
                </div>
                
                <ScrollDrivenChatbot
                  activeFeature={activeFeature}
                  onSequenceComplete={() => setVisibleFeatureIndex(activeIndex)}
                  className="w-full h-[450px] md:h-[480px]"
                />
              </>
            )}
          </div>

          {/* Right Side: Artifact Canvas */}
          <div className="relative w-full hidden lg:flex h-[60vh] md:h-[80vh] flex-col justify-center lg:col-span-7 xl:col-span-7">
            {visibleFeature && (
              <MockArtifactCanvas 
                documentTitle={visibleFeature.documentTitle} 
                content={visibleFeature.content} 
              />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
