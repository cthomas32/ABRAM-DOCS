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
  <svg className="h-5 w-auto" viewBox="0 0 70 30" fill="currentColor">
    {/* Letter A */}
    <polygon points="12.5 5 2.5 25 7.5 25 10 20 15 20 17.5 25 22.5 25" />
    <polygon points="11 16 14 16 12.5 11" />
    {/* Number 2 */}
    <path d="M 27 10 C 27 6, 37 6, 37 10 C 37 14, 27 19, 27 25 L 39 25 L 39 22 L 31 22 C 33 19, 39 14, 39 10 C 39 5, 27 5, 27 10 Z" />
    {/* Number 4 */}
    <path d="M 52 5 L 45 18 L 54 18 L 54 5 L 57 5 L 57 18 L 60 18 L 60 21 L 57 21 L 57 25 L 54 25 L 54 21 L 43 21 L 43 18 Z" />
  </svg>
);

const SonyLogo = () => (
  <svg className="h-4 w-auto" viewBox="0 0 100 20" fill="currentColor">
    {/* High-fidelity vector block representing S-O-N-Y letters */}
    <path d="M14.2 3.6c-1.8-.7-4.2-1.3-6.4-1.3-4.5 0-7.3 2.1-7.3 5.4 0 7.3 10.6 5.8 10.6 9.6 0 1.7-1.5 2.7-4.2 2.7-2.9 0-5.7-1-7.7-2l-.5 2.6c2.3.9 5.3 1.5 8.1 1.5 4.8 0 7.8-2.1 7.8-5.6-.1-7.6-10.7-6-10.7-9.8 0-1.5 1.5-2.5 3.9-2.5 2.3 0 4.8.8 6.2 1.4l.2-2zM40 9.8c0-5.7-3.9-9.8-9.9-9.8-6 0-10.1 4.1-10.1 9.8 0 5.7 4.1 9.9 10.1 9.9 6 0 9.9-4.2 9.9-9.9zm-16.1 0c0-4.3 2.6-7.2 6.2-7.2s6.1 2.9 6.1 7.2-2.5 7.3-6.1 7.3-6.2-3-6.2-7.3zM69.1.3h-3.3L52 13V.3h-3.5v19.4H52L65.6 7v12.7h3.5V.3zM99.2.3H95L86.6 9.8 78.2.3h-4.2l10.1 11.2V19.7h3.5V11.5L99.2.3z" />
  </svg>
);

const REDLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 60 25" fill="currentColor">
    {/* Letter R */}
    <path d="M 0 5 L 12 5 C 16 5, 16 12, 12 12 L 6 12 L 13 25 L 7 25 L 1 13 L 1 25 L -5 25 L -5 5 Z" transform="translate(5, 0)" />
    {/* Letter E */}
    <path d="M 20 5 L 32 5 L 32 8 L 24 8 L 24 13 L 30 13 L 30 16 L 24 16 L 24 21 L 32 21 L 32 25 L 20 25 Z" />
    {/* Letter D */}
    <path d="M 37 5 L 46 5 C 52 5, 52 25, 46 25 L 37 25 Z M 41 8 L 41 22 L 45 22 C 48 22, 48 8, 45 8 Z" />
  </svg>
);

const AuraLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 38 25" fill="currentColor">
    {/* Dolby Double-D Logo */}
    <path d="M 10 2.5 A 10 10 0 0 0 10 22.5 L 14 22.5 L 14 2.5 Z" />
    <path d="M 28 2.5 L 24 2.5 L 24 22.5 L 28 22.5 A 10 10 0 0 0 28 2.5 Z" />
    <rect x="16" y="2.5" width="6" height="20" />
  </svg>
);

const VortexLogo = () => (
  <svg className="h-6 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.785-8.893-.982-.336.076-.67-.137-.747-.473-.077-.337.137-.67.473-.748 3.854-.88 7.15-.502 9.82 1.135.295.18.387.564.207.86zm1.223-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.847-.107-.972-.52-.125-.413.107-.847.52-.972 3.676-1.115 8.246-.575 11.347 1.33.367.226.487.707.26 1.074zm.107-2.828c-3.26-1.937-8.644-2.12-11.76-1.173-.5.152-1.025-.133-1.177-.633-.152-.5.133-1.025.633-1.177 3.616-1.098 9.564-.88 13.317 1.347.45.267.6.845.333 1.295-.267.45-.845.6-1.295.333z" />
  </svg>
);

const logos = [
  { name: "Nebula", component: NebulaLogo },
  { name: "Onyx", component: OnyxLogo },
  { name: "Sony", component: SonyLogo },
  { name: "RED", component: REDLogo },
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
