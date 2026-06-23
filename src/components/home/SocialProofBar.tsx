"use client";

import { motion } from "framer-motion";

const NebulaLogo = () => (
  <svg className="h-6 w-auto" viewBox="0 0 24 32" fill="currentColor">
    <path d="M16.5 0h7.5v32h-7.5zm-16.5 0h7.5v32h-7.5z M7.5 0l9 24v-24h7.5v32h-7.5l-9-24v24h-7.5v-32z" />
  </svg>
);

const HelixLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 5.3c-.3 0-.6.1-.9.2-2.1.8-6.1 3.5-10.4 7.6-3.7 3.5-6.5 7.6-7.5 9.7-.3.6-.5 1.1-.5 1.4 0 .3.2.4.4.4.4 0 1.2-.6 2.3-1.6 4.3-3.8 11.2-11.4 15.3-16.2.8-.9 1.4-1.4 1.4-1.5 0-.1-.1-.1-.1-.1z" />
  </svg>
);

const OnyxLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
    {/* Faceted diamond/crystal shape for Onyx */}
    <path d="M12 2L2 9.5 5.5 21h13L22 9.5 12 2zm0 3.2l6.8 5.1H5.2L12 5.2zM7.1 19l-2.4-7.8h14.6L16.9 19H7.1z" />
  </svg>
);

const SensaLogo = () => (
  <svg className="h-4 w-auto" viewBox="0 0 24 24" fill="currentColor">
    {/* Abstract organic curve shape representing Sensa */}
    <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1 5h-2v10h2V7z" />
  </svg>
);

const SpireLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
    {/* Minimalist tall peaks representing Spire */}
    <path d="M8 6l-6 16h12L8 6zm8-4L10 22h12L16 2z" />
  </svg>
);

const AuraLogo = () => (
  <svg className="h-4.5 w-auto" viewBox="0 0 24 24" fill="currentColor">
    {/* Minimalist celestial eclipse shape representing Aura */}
    <path d="M12 4a8 8 0 00-6.4 12.8 8 8 0 1112.8-6.4A7.95 7.95 0 0012 4z" />
  </svg>
);

const VortexLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 24 24" fill="currentColor">
    {/* Minimalist abstract vortex spiral representing Vortex */}
    <path d="M12 2C6.5 2 2 6.5 2 12c0 2.8 1.1 5.3 3 7.1l1.4-1.4C4.8 16.1 4 14.1 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4c0 1.1-.9 2-2 2s-2-.9-2-2" />
  </svg>
);

const logos = [
  { name: "Nebula", component: NebulaLogo },
  { name: "Onyx", component: OnyxLogo },
  { name: "Sensa", component: SensaLogo },
  { name: "Spire", component: SpireLogo },
  { name: "Aura", component: AuraLogo },
  { name: "Helix", component: HelixLogo },
  { name: "Vortex", component: VortexLogo },
];

export default function SocialProofBar() {
  return (
    <section 
      id="social-proof" 
      className="relative w-full border-y border-white/[0.08] bg-transparent py-10 px-4 sm:px-6 lg:px-8 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Label centered above ticker */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-white/30 uppercase">
            Trusted by creators and high-output brand partners
          </span>
        </div>

        {/* Seamless Infinite Scroll Marquee Container */}
        <div className="relative flex overflow-hidden w-full py-4 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-24 before:bg-gradient-to-r before:from-abram-black before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-24 after:bg-gradient-to-l after:from-abram-black after:to-transparent">
          <motion.div
            className="flex gap-24 items-center shrink-0 pr-24"
            animate={{ x: [0, "-50%"] }}
            transition={{
              ease: "linear",
              duration: 25,
              repeat: Infinity,
            }}
          >
            {/* List 1 */}
            {logos.map((logo, i) => (
              <div 
                key={`logo-1-${i}`} 
                className="text-white/20 hover:text-white/80 transition-colors duration-300 flex items-center justify-center shrink-0"
              >
                <logo.component />
              </div>
            ))}
            {/* List 2 (Duplicate for seamless loop) */}
            {logos.map((logo, i) => (
              <div 
                key={`logo-2-${i}`} 
                className="text-white/20 hover:text-white/80 transition-colors duration-300 flex items-center justify-center shrink-0"
              >
                <logo.component />
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
