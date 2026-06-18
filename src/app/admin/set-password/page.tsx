"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
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
          Setup Password
        </h1>
        <p className="text-xs text-zinc-500 mb-8 uppercase tracking-widest font-sans">
          Define a password for your account
        </p>

        <form onSubmit={handleSetPassword} className="w-full space-y-5">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Password saved! Redirecting to dashboard...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2 font-sans"
            >
              New Password
            </label>
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

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2 font-sans"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white/[0.03] border border-white/8 rounded-full px-5 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 h-11 font-sans"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full text-center py-3 text-xs font-semibold select-none flex items-center justify-center h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Saving Password...
                </>
              ) : (
                "Save Password"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
