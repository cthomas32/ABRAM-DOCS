"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, requestPasswordReset } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
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
        <p className="text-xs text-zinc-500 mb-8 uppercase tracking-widest font-sans text-center">
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
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2">
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
                  className="btn-primary w-full text-center py-3 text-xs font-semibold select-none flex items-center justify-center h-11"
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
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2">
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
                    className="btn-primary w-full text-center py-3 text-xs font-semibold select-none flex items-center justify-center h-11"
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
