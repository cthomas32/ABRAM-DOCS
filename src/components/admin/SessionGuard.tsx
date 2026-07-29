"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, RefreshCw, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isAuthError, type QueryError } from "@/utils/supabase/session";

/**
 * Watches the admin session and takes over the screen once it lapses.
 *
 * Without this a stale session shows up as whatever the database said,
 * so an editor sees "JWT expired" in a red bar and has no idea that the
 * answer is to sign in again. Work in progress is never thrown away
 * silently: the panel sits on top, and the page underneath is untouched
 * if the session comes back.
 */

interface SessionGuardValue {
  /**
   * Hand a failed query here. Returns true when the failure was the
   * session, meaning the caller should not also show its own error.
   */
  reportError: (error: QueryError | null | undefined) => boolean;
  /** Call before an intentional sign out so the panel stays away. */
  markSigningOut: () => void;
}

const SessionGuardContext = createContext<SessionGuardValue>({
  reportError: () => false,
  markSigningOut: () => {},
});

export const useSessionGuard = () => useContext(SessionGuardContext);

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [expired, setExpired] = useState(false);
  // Signing out emits the same event as expiring, so it is flagged first.
  const signingOut = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // A transient network failure keeps the session, so reaching here
        // means the refresh was refused rather than merely unreachable.
        if (!signingOut.current) setExpired(true);
        return;
      }
      if (session) setExpired(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const reportError = useCallback((error: QueryError | null | undefined) => {
    if (!isAuthError(error)) return false;
    setExpired(true);
    return true;
  }, []);

  const markSigningOut = useCallback(() => {
    signingOut.current = true;
  }, []);

  return (
    <SessionGuardContext.Provider value={{ reportError, markSigningOut }}>
      {children}

      {expired ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center shadow-2xl">
            <span className="w-11 h-11 mx-auto mb-4 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </span>

            <h2 id="session-expired-title" className="text-sm font-bold tracking-tight text-white">
              Your session expired
            </h2>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Sign in again to carry on. Anything already saved is safe; unsaved edits on this
              screen are still here if you sign in from another tab and reload.
            </p>

            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => router.push("/admin")}
                className="btn-primary w-full py-2.5 text-xs rounded-full flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in again
              </button>
              <button
                onClick={() => router.refresh()}
                className="btn-glass w-full py-2.5 text-xs rounded-full flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SessionGuardContext.Provider>
  );
}
