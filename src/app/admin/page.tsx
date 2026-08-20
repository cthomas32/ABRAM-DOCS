"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, requestPasswordReset } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Where to go after signing in.
   *
   * Almost always the dashboard. The exception is the OAuth consent
   * screen, which sends people here when they are not signed in and needs
   * them back on the request they interrupted.
   *
   * Only a path on this site is honoured, and it has to start with a
   * single slash. A value beginning "//" is a protocol-relative URL to
   * another host, which is how a login page becomes an open redirector
   * that lands somebody on a convincing copy of itself.
   */
  const nextPath = (() => {
    const raw = searchParams?.get("next");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/admin/dashboard";
    return raw;
  })();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(nextPath);
      router.refresh();
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-8 flex items-center justify-center bg-[#0A0A0A] px-4 relative overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-white/5 glass-panel relative z-10 flex flex-col items-center"
      >
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-sans">
          {isForgotPassword ? "Reset Password" : "ABRAM CMS"}
        </h1>
        <p className="text-xs text-zinc-400 mb-8 uppercase tracking-widest font-sans text-center">
          {isForgotPassword
            ? "Send a secure recovery email"
            : "Authorized Team Access"}
        </p>

        <AnimatePresence mode="wait">
          {!isForgotPassword ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="w-full space-y-5"
            >
              {error && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2 font-sans"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@abram.network"
                  className="w-full bg-white/[0.03] border border-white/8 rounded-full px-5 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 h-11 font-sans"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 font-sans"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError("");
                      setSuccess(false);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-semibold font-sans"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/8 rounded-full px-5 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 h-11 font-sans"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-center py-3 text-xs font-medium select-none flex items-center justify-center h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleResetRequest}
              className="w-full space-y-5"
            >
              {error && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3 w-full">
                  <div className="text-zinc-200 text-xs font-medium flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>A password recovery link has been sent to your email address. Please check your inbox.</span>
                  </div>
                </div>
              )}

              {!success && (
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2 font-sans"
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@abram.network"
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-5 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 h-11 font-sans"
                  />
                </div>
              )}

              <div className="pt-2 space-y-3">
                {!success && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full text-center py-3 text-xs font-medium select-none flex items-center justify-center h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                        Sending Email...
                      </>
                    ) : (
                      "Send Recovery Email"
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setSuccess(false);
                    setError("");
                  }}
                  className="btn-ghost w-full text-center py-3 text-xs font-semibold text-zinc-400 hover:text-white select-none h-11"
                >
                  Back to Sign In
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

/**
 * `useSearchParams` reads the `next` the consent screen sends people here
 * with, and reading it opts the page out of being prerendered. A boundary
 * is what lets the shell render at build time and the form fill in on the
 * client, which is the difference between this and a build failure.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0A0A0A]" />}>
      <LoginForm />
    </Suspense>
  );
}
