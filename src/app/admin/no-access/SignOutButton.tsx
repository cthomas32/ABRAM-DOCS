"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { signOut } from "../actions";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    // A full navigation rather than a push: the middleware has to see the
    // cleared cookie, and a client-side transition would not give it one.
    window.location.href = "/admin";
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="btn-glass w-full py-2.5 text-xs rounded-full flex items-center justify-center gap-1.5 disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
      Sign out
    </button>
  );
}
