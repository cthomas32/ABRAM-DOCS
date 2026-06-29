"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronUp, Check, X } from "lucide-react";

interface CookieConsentProps {
  isOpen: boolean; // Managed by parent to force open settings
  onClose: () => void;
}

interface ConsentState {
  ad_storage: boolean;
  ad_user_data: boolean;
  ad_personalization: boolean;
  analytics_storage: boolean;
}

export default function CookieConsent({ isOpen, onClose }: CookieConsentProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle states
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // 1. Initial mounting check
  useEffect(() => {
    setMounted(true);
    let timer: NodeJS.Timeout | null = null;
    let listenersRegistered = false;

    const events = ["scroll", "click", "touchstart", "mousemove", "keydown"];

    const showBanner = () => {
      setIsVisible(true);
      cleanup();
    };

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (listenersRegistered) {
        events.forEach((event) => {
          window.removeEventListener(event, showBanner);
        });
        listenersRegistered = false;
      }
    };

    try {
      const saved = localStorage.getItem("abram-consent-v2");
      if (!saved) {
        // Show banner on user interaction or fallback timer to prevent LCP hijack
        events.forEach((event) => {
          window.addEventListener(event, showBanner, { passive: true });
        });
        listenersRegistered = true;
        timer = setTimeout(showBanner, 5000);
      } else {
        const parsed = JSON.parse(saved) as ConsentState;
        setAnalyticsConsent(!!parsed.analytics_storage);
        setMarketingConsent(!!parsed.ad_storage);
      }
    } catch (e) {
      // Fallback in case of localStorage access/parsing failure
      events.forEach((event) => {
        window.addEventListener(event, showBanner, { passive: true });
      });
      listenersRegistered = true;
      timer = setTimeout(showBanner, 5000);
    }

    return cleanup;
  }, []);

  // 2. React to parent force-open (e.g. from footer click)
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExpanded(true); // Automatically expand options if manually requested
    }
  }, [isOpen]);

  if (!mounted) return null;

  const updateConsentPreferences = (analytics: boolean, marketing: boolean) => {
    const consentPayload: ConsentState = {
      ad_storage: marketing,
      ad_user_data: marketing,
      ad_personalization: marketing,
      analytics_storage: analytics,
    };

    // Save to localStorage
    try {
      localStorage.setItem("abram-consent-v2", JSON.stringify(consentPayload));
    } catch (e) {
      console.error("CookieConsent: Failed to save consent preferences:", e);
    }

    // Call gtag.js update if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("set", "ads_data_redaction", !marketing);
      (window as any).gtag("consent", "update", {
        ad_storage: marketing ? "granted" : "denied",
        ad_user_data: marketing ? "granted" : "denied",
        ad_personalization: marketing ? "granted" : "denied",
        analytics_storage: analytics ? "granted" : "denied",
      });
    }

    setIsVisible(false);
    setIsExpanded(false);
    onClose();
  };

  const handleAcceptAll = () => {
    setAnalyticsConsent(true);
    setMarketingConsent(true);
    updateConsentPreferences(true, true);
  };

  const handleRejectAll = () => {
    setAnalyticsConsent(false);
    setMarketingConsent(false);
    updateConsentPreferences(false, false);
  };

  const handleSaveCustom = () => {
    updateConsentPreferences(analyticsConsent, marketingConsent);
  };

  // Switch/Toggle sub-component
  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    ariaLabel: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
        checked ? "bg-white" : "bg-white/10"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4 bg-[#0A0A0A]" : "translate-x-0 bg-zinc-400"
        }`}
      />
    </button>
  );

  return (
    <AnimatePresence>
      {(isVisible || isOpen) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:max-w-md select-none"
        >
          {/* Main glassmorphic card container */}
          <div className="glass-panel bg-[#0A0A0A]/85! backdrop-blur-[60px]! w-full rounded-2xl shadow-2xl border border-white/8 p-4 sm:p-5 md:p-6 text-white flex flex-col gap-3.5 sm:gap-4 relative overflow-hidden">
            {/* Subtle top red glow accent to match ABRAM layout */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-abram-accent/50 to-transparent" />

            {/* Header info */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-abram-accent" />
                    <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
                      Privacy & Consent
                    </span>
                  </div>
                  {/* Close button only visible if forced open */}
                  {isOpen && (
                    <button
                      onClick={() => {
                        setIsVisible(false);
                        onClose();
                      }}
                      className="p-1 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer animate-none"
                      aria-label="Close privacy preferences"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs leading-snug sm:leading-relaxed text-zinc-400 font-light mt-1">
                  We use cookies and telemetry metrics to optimize performance, measure visitor usage patterns, and improve platform AI features. You can adjust your consent choices below.
                </p>
              </div>
            </div>

            {/* Expandable customized settings */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-white/5 pt-3 mt-1 flex flex-col gap-3.5"
                >
                  {/* 1. Necessary (always active) */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200">
                          Essential Cookies
                        </span>
                        <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400">
                          Always Active
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-500 font-light mt-0.5">
                        Required for secure login authentication, routing, and saving your preferences.
                      </p>
                    </div>
                     <ToggleSwitch
                      checked={true}
                      onChange={() => {}}
                      disabled={true}
                      ariaLabel="Essential Cookies (Always Active)"
                    />
                  </div>

                  {/* 2. Analytics Cookies */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-zinc-200">
                        Analytics & Performance
                      </span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 font-light mt-0.5">
                        Helps our team track page performance, feature load times, and usage trends.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={analyticsConsent}
                      onChange={() => setAnalyticsConsent(!analyticsConsent)}
                      ariaLabel="Analytics and Performance Cookies"
                    />
                  </div>

                  {/* 3. Marketing & Ads Data */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-zinc-200">
                        Personalized Recommendations & Ads
                      </span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 font-light mt-0.5">
                        Used to measure effectiveness of campaigns and show tailored marketing updates.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={marketingConsent}
                      onChange={() => setMarketingConsent(!marketingConsent)}
                      ariaLabel="Personalized Recommendations and Ads"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons footer */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex gap-2 w-full">
                {isExpanded ? (
                  <>
                    <button
                      onClick={handleSaveCustom}
                      className="btn-primary flex-1 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      Save Settings
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="btn-glass flex-1 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      Accept All
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAcceptAll}
                      className="btn-primary flex-1 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="btn-glass flex-1 py-1.5 text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                    >
                      Customize <ChevronDown className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                <button
                  onClick={handleRejectAll}
                  className="btn-ghost text-[10px] py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Reject Optional Cookies
                </button>
                <a
                  href="/privacy-policy"
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
