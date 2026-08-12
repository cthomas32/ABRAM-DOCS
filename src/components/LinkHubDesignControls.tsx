'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Palette, Type, Layers, Globe, Share2, Video, Briefcase, ArrowUpRight } from "lucide-react";
import LinkHubIcon from "@/components/links/LinkHubIcon";

/**
 * Link Hub Design Showcase.
 *
 * Rendered identically to the top hero phone mockup, featuring Sienna Vance's bio page
 * cycling through canonical theme presets automatically inside an iPhone frame.
 *
 * SHARED between /creators and /alternatives/linktree.
 */

const capabilityPills = [
  "7 Block Types",
  "7 Theme Presets",
  "12 Backgrounds",
  "11 Fonts",
  "5 Button Styles",
  "3 Button Shapes",
  "3 Avatar Shapes",
  "Per-Block Click Tracking",
];

const highlightsList = [
  {
    icon: Layers,
    color: "text-emerald-400",
    title: "7 Block Types",
    desc: "Links, video embeds, collections, social strips, header dividers, email & phone.",
  },
  {
    icon: Palette,
    color: "text-amber-400",
    title: "7 Themes & 12 Backgrounds",
    desc: "Solid darks, dual-tone gradients, glowing aura backdrops, or uploaded images.",
  },
  {
    icon: Type,
    color: "text-sky-400",
    title: "11 Fonts & 5 Button Styles",
    desc: "Glassmorphism, solid fill, outline, soft, or retro hard shadow buttons.",
  },
];

const linkHubThemes = [
  {
    id: "midnight",
    name: "Midnight Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-[#0A0A0A]",
    headerText: "text-white",
    subtext: "text-blue-200/70",
    cardBg: "bg-[#111C33]/40 border border-white/10 rounded-2xl shadow-lg",
    cardText: "text-[#8ECAFF]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#8ECAFF]/20 text-[#8ECAFF] rounded-xl",
    socialBg: "bg-[#111C33]/40 border border-white/10 text-[#8ECAFF]",
    arrowColor: "text-zinc-400",
  },
  {
    id: "paper",
    name: "Paper Preset",
    isLight: true,
    fontClass: "font-sans",
    bg: "bg-[#F5F4F0]",
    headerText: "text-[#0A0A0A]",
    subtext: "text-zinc-600",
    cardBg: "bg-white border-2 border-[#0A0A0A] rounded-sm shadow-[3px_3px_0px_#0A0A0A]",
    cardText: "text-[#0A0A0A]",
    cardSub: "text-zinc-600",
    iconBg: "bg-[#0A0A0A] text-white rounded-sm",
    socialBg: "bg-white border-2 border-[#0A0A0A] text-[#0A0A0A]",
    arrowColor: "text-[#0A0A0A]",
  },
  {
    id: "studio",
    name: "Studio Preset",
    isLight: false,
    fontClass: "font-display",
    bg: "bg-[#101014]",
    headerText: "text-white",
    subtext: "text-purple-200/70",
    cardBg: "bg-[#1C1A22] border border-[#C4A6FF]/20 rounded-full shadow-md",
    cardText: "text-[#C4A6FF]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#C4A6FF]/20 text-[#C4A6FF] rounded-full",
    socialBg: "bg-[#1C1A22] border border-[#C4A6FF]/20 text-[#C4A6FF]",
    arrowColor: "text-[#C4A6FF]",
  },
  {
    id: "daylight",
    name: "Daylight Preset",
    isLight: true,
    fontClass: "font-sans",
    bg: "bg-gradient-to-b from-white to-[#DCEBFF]",
    headerText: "text-[#0A0A0A]",
    subtext: "text-blue-700/80",
    cardBg: "bg-[#0A0A0A] border border-black/10 rounded-full shadow-lg",
    cardText: "text-white",
    cardSub: "text-zinc-300",
    iconBg: "bg-white/20 text-white rounded-full",
    socialBg: "bg-white border border-blue-200 text-[#2563EB] shadow-sm",
    arrowColor: "text-white",
  },
  {
    id: "reel",
    name: "Reel Preset",
    isLight: false,
    fontClass: "font-mono",
    bg: "bg-[#07110D]",
    headerText: "text-[#EAFFF5]",
    subtext: "text-emerald-400/80",
    cardBg: "bg-[#07110D] border border-[#4ADE80] rounded-none shadow-[0_0_15px_rgba(74,222,128,0.15)]",
    cardText: "text-[#4ADE80]",
    cardSub: "text-emerald-200/60",
    iconBg: "bg-[#4ADE80]/20 text-[#4ADE80] rounded-none",
    socialBg: "bg-[#07110D] border border-[#4ADE80] text-[#4ADE80]",
    arrowColor: "text-[#4ADE80]",
  },
  {
    id: "ember",
    name: "Ember Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-[#140A08]",
    headerText: "text-white",
    subtext: "text-orange-200/70",
    cardBg: "bg-[#1F110C] border border-[#FF9E64]/25 rounded-2xl shadow-xl",
    cardText: "text-[#FF9E64]",
    cardSub: "text-zinc-400",
    iconBg: "bg-[#FF9E64]/20 text-[#FF9E64] rounded-xl",
    socialBg: "bg-[#1F110C] border border-[#FF9E64]/25 text-[#FF9E64]",
    arrowColor: "text-[#FF9E64]",
  },
  {
    id: "carbon",
    name: "Carbon Preset",
    isLight: false,
    fontClass: "font-sans",
    bg: "bg-black",
    headerText: "text-white",
    subtext: "text-zinc-400",
    cardBg: "bg-transparent border border-white/30 rounded-full",
    cardText: "text-white",
    cardSub: "text-zinc-400",
    iconBg: "bg-white/10 text-white rounded-full",
    socialBg: "bg-transparent border border-white/30 text-white",
    arrowColor: "text-white",
  },
];

export default function LinkHubDesignControls() {
  const [themeIndex, setThemeIndex] = useState(0);

  // Auto-cycle themes every 3.2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % linkHubThemes.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const activeTheme = linkHubThemes[themeIndex];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/30 backdrop-blur-md overflow-hidden p-6 sm:p-8 lg:p-10 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[250px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Design Capabilities (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2 inline-block font-sans">
              LINK HUB DESIGN
            </span>
            <h3 className="text-xl sm:text-2xl font-medium text-white font-sans tracking-tight">
              Make the page look like you
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-2 leading-relaxed">
              Included free on every ABRAM plan. Full theme styling, custom fonts, button borders, and layout options unlock at Solo Lite ($19/mo).
            </p>
          </div>

          {/* Quick Capability Badges */}
          <div className="flex flex-wrap gap-1.5">
            {capabilityPills.map((pill) => (
              <span
                key={pill}
                className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-sans text-zinc-300"
              >
                {pill}
              </span>
            ))}
          </div>

          {/* Feature Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
            {highlightsList.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <h4 className="text-xs font-semibold text-white font-sans">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-normal">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Link */}
          <div className="pt-2">
            <Link
              href="/alternatives/linktree"
              className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-emerald-300 transition-colors group"
            >
              <span>Compare Link Hub vs Linktree</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Cycling iPhone Mockup Identical to Top Hero (5 Cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div
            className={`w-[290px] sm:w-[300px] h-[570px] rounded-[52px] border-[9px] border-zinc-800 p-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden select-none flex flex-col justify-between border-t-zinc-700 border-b-zinc-900 transition-colors duration-700 ${activeTheme.bg}`}
          >
            {/* Top Centered Dynamic Island Notch */}
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto relative z-20 flex items-center justify-end px-2 shadow-inner shrink-0">
              <div className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800/80" />
            </div>

            {/* Animated Inner Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTheme.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`space-y-4 text-center pt-3 flex flex-col justify-between h-full ${activeTheme.fontClass}`}
              >
                {/* Profile Header */}
                <div className="space-y-3">
                  {/* Avatar Cropped in on Sienna's Face */}
                  <div className="w-16 h-16 rounded-full border-2 border-white/20 shadow-xl overflow-hidden relative mx-auto shrink-0">
                    <Image
                      src="/creators/influencer-avatar.jpg"
                      alt="Sienna Vance"
                      fill
                      sizes="64px"
                      className="object-cover object-center"
                      priority
                    />
                  </div>

                  <div>
                    <div className={`text-base font-semibold tracking-tight transition-colors duration-500 ${activeTheme.headerText}`}>
                      Sienna Vance
                    </div>
                    <div className={`text-[11px] mt-0.5 transition-colors duration-500 ${activeTheme.subtext}`}>
                      Fashion & Lifestyle Creator · @sienna.vance
                    </div>
                  </div>

                  {/* Social Icons Row */}
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                      <LinkHubIcon icon="instagram" className="w-3.5 h-3.5" />
                    </div>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                      <LinkHubIcon icon="youtube" className="w-3.5 h-3.5" />
                    </div>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500 ${activeTheme.socialBg}`}>
                      <LinkHubIcon icon="tiktok" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Link Cards Showcase */}
                <div className="space-y-2.5 pt-2 px-1">
                  <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                          Weekly Style Vlog & Outfits
                        </div>
                        <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                          Updated every Sunday
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
                  </div>

                  <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                          Skincare Routine & Holy Grails
                        </div>
                        <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                          Featured video guide
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
                  </div>

                  <div className={`p-3.5 text-left flex items-center justify-between transition-colors duration-500 ${activeTheme.cardBg}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 transition-colors duration-500 ${activeTheme.iconBg}`}>
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-[11px] font-semibold transition-colors duration-500 ${activeTheme.cardText}`}>
                          Brand Partnerships & Rates
                        </div>
                        <div className={`text-[9.5px] transition-colors duration-500 ${activeTheme.cardSub}`}>
                          Media kit & booking form
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className={`w-3.5 h-3.5 transition-colors duration-500 ${activeTheme.arrowColor}`} />
                  </div>
                </div>

                {/* iOS Home Indicator Bar */}
                <div className="pt-2 text-center">
                  <div className={`w-24 h-1 rounded-full mx-auto transition-colors duration-500 ${activeTheme.isLight ? "bg-black/30" : "bg-white/20"}`} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
