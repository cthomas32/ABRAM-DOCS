"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface NewsletterSignupProps {
  variant?: "card" | "inline";
  className?: string;
}

export default function NewsletterSignup({
  variant = "card",
  className = "",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [submittingDetails, setSubmittingDetails] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe. Please try again.");
      }

      if (data.alreadySubscribed) {
        setIsAlreadySubscribed(true);
        setStatus("success");
        setEmail("");
      } else {
        setIsAlreadySubscribed(false);
        setSubscribedEmail(email);
        setEmail("");
        setStatus("idle"); // Clear loading state but keep successful email reference
        setShowProfileModal(true); // Open details popup modal
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDetails(true);
    setModalErrorMessage("");

    try {
      const response = await fetch("/api/newsletter/update-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: subscribedEmail,
          firstName: profileFirstName.trim() || undefined,
          lastName: profileLastName.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          companySize: companySize || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile details.");
      }

      setShowProfileModal(false);
      setStatus("success");
    } catch (err: any) {
      setModalErrorMessage(err.message || "An error occurred while updating profile.");
    } finally {
      setSubmittingDetails(false);
    }
  };

  const handleSkipProfile = () => {
    setShowProfileModal(false);
    setStatus("success");
  };

  const isCard = variant === "card";

  return (
    <div
      className={`relative z-10 w-full transition-all duration-300 ${
        isCard
          ? "rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 sm:p-8 md:p-10 hover:border-white/10 hover:bg-zinc-900/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-0 p-0"
      } ${className}`}
    >
      {/* Decorative Viewfinder Brackets for Premium Card Variant */}
      {isCard && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/5 group-hover:border-white/15 transition-colors duration-300" />
        </>
      )}

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center text-center py-6 min-h-[180px]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            >
              <Check className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-semibold tracking-tight text-white font-sans">
              {isAlreadySubscribed ? "Already Subscribed" : "Successfully Subscribed"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed font-sans">
              {isAlreadySubscribed
                ? "You are already subscribed to our newsletter updates. Thank you for your continued support!"
                : "You've been added to our network updates. Keep an eye on your inbox for our latest system releases and articles."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isCard && (
              <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block mb-1.5">
                  ABRAM JOURNAL
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 font-sans">
                  Subscribe to Network Intelligence
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl font-sans">
                  Join our list to receive release logs, workflow optimization blueprints, and expert perspectives on AI-assisted creative production.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              {/* Email & Submit Input Group */}
              <div className="flex flex-col space-y-1.5">
                <label
                  htmlFor="email"
                  className={isCard ? "text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans" : "sr-only"}
                >
                  Email Address <span className="text-[#CE1C1C]">*</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-grow">
                    <input
                      id="email"
                      type="email"
                      required
                      aria-required="true"
                      aria-invalid={status === "error" ? "true" : "false"}
                      aria-describedby={status === "error" ? "email-error-msg" : undefined}
                      placeholder="alexis@vesper.studio"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                        setIsAlreadySubscribed(false);
                      }}
                      disabled={status === "loading"}
                      className={`w-full h-11 px-4 text-xs text-zinc-100 placeholder-zinc-600 bg-zinc-950/40 rounded-full border transition-all duration-200 outline-none disabled:opacity-50 ${
                        status === "error"
                          ? "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20"
                          : "border-white/5 hover:border-white/10 focus:border-white/20 focus:ring-white/20"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-black text-xs font-semibold px-6 h-11 hover:bg-zinc-200 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Join List
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Graceful Validation Error Display */}
              <AnimatePresence>
                {status === "error" && errorMessage && (
                  <motion.div
                    id="email-error-msg"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3 mt-2 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spam/Privacy Notice */}
              {isCard && (
                <p className="text-[10px] text-zinc-500 leading-relaxed font-light text-center sm:text-left mt-2">
                  We value your attention. Unsubscribe at any time. Read our{" "}
                  <Link
                    href="/privacy-policy"
                    className="underline hover:text-zinc-300 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Completion Pop-up Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop (tap-dismiss disabled to enforce profile completion) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl relative z-10 space-y-6 shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-1.5">
                  Step 2 of 2
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Complete Your Profile
                </h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Please provide your details below to finalize your ABRAM subscription.
                </p>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                {/* First & Last Name Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label
                      htmlFor="modalFirstName"
                      className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
                    >
                      First Name <span className="text-[#CE1C1C]">*</span>
                    </label>
                    <input
                      id="modalFirstName"
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      disabled={submittingDetails}
                      className="w-full h-10 px-4 text-xs text-zinc-100 placeholder-zinc-600 bg-zinc-950/50 rounded-full border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label
                      htmlFor="modalLastName"
                      className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
                    >
                      Last Name <span className="text-[#CE1C1C]">*</span>
                    </label>
                    <input
                      id="modalLastName"
                      type="text"
                      required
                      placeholder="e.g. Doe"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      disabled={submittingDetails}
                      className="w-full h-10 px-4 text-xs text-zinc-100 placeholder-zinc-600 bg-zinc-950/50 rounded-full border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Job Title Input */}
                <div className="flex flex-col space-y-1.5">
                  <label
                    htmlFor="modalJobTitle"
                    className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
                  >
                    Job Title <span className="text-[#CE1C1C]">*</span>
                  </label>
                  <input
                    id="modalJobTitle"
                    type="text"
                    required
                    placeholder="e.g. Producer, Creative Director, Editor"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    disabled={submittingDetails}
                    className="w-full h-10 px-4 text-xs text-zinc-100 placeholder-zinc-600 bg-zinc-950/50 rounded-full border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                {/* Company Size Dropdown */}
                <div className="flex flex-col space-y-1.5">
                  <label
                    htmlFor="modalCompanySize"
                    className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
                  >
                    Company Size <span className="text-[#CE1C1C]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="modalCompanySize"
                      required
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      disabled={submittingDetails}
                      className="w-full h-10 px-4 pr-10 text-xs text-zinc-100 bg-zinc-950/50 rounded-full border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 font-sans"
                    >
                      <option value="" className="bg-zinc-950 text-zinc-500 font-sans">Select company size...</option>
                      <option value="1" className="bg-zinc-950 text-zinc-200 font-sans">1 (Solo)</option>
                      <option value="2-10" className="bg-zinc-950 text-zinc-200 font-sans">2-10 employees</option>
                      <option value="11-50" className="bg-zinc-950 text-zinc-200 font-sans">11-50 employees</option>
                      <option value="51-200" className="bg-zinc-950 text-zinc-200 font-sans">51-200 employees</option>
                      <option value="201-500" className="bg-zinc-950 text-zinc-200 font-sans">201-500 employees</option>
                      <option value="500+" className="bg-zinc-950 text-zinc-200 font-sans">500+ employees</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Error Banner inside Modal */}
                {modalErrorMessage && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3 mt-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{modalErrorMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingDetails}
                    className="btn-primary w-full h-10 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  >
                    {submittingDetails ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Finishing signup...
                      </>
                    ) : (
                      <span>Complete Signup</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
