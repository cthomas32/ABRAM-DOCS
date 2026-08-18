import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import SignOutButton from "./SignOutButton";

/**
 * Where somebody lands when they are signed in and hold no permissions.
 *
 * This page exists because the alternative is a redirect loop. The login
 * page sends a signed-in user onward; a user with no console row has
 * nowhere onward to go, so without this they bounce between the two
 * forever and the symptom looks like the site being down.
 *
 * It is also the screen an invited teammate sees in the gap between their
 * account existing and their role being set, so it says what to do rather
 * than just refusing.
 */

export const metadata: Metadata = {
  title: "No access | ABRAM",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 py-12 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-white/5 glass-panel p-6 sm:p-8 text-center">
        <span className="w-11 h-11 mx-auto mb-5 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
        </span>

        <h1 className="text-xl font-bold tracking-tight text-white">
          Your account has no access yet
        </h1>

        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          You are signed in, but no role has been assigned to this account. Ask an owner to set one
          and then sign in again — nothing needs to be created a second time.
        </p>

        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
