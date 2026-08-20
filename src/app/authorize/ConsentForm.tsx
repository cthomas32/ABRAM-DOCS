"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { approveAuthorization, denyAuthorization } from "./actions";

/**
 * Two buttons and the honesty to say what they do.
 *
 * The redirect is done here with `window.location` rather than with a
 * server redirect, because the destination is another origin and a
 * navigation the browser performs itself is the one that reliably lands.
 */

export interface ConsentProps {
  clientId: string;
  clientName: string;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  resource: string | null;
}

export default function ConsentForm(props: ConsentProps) {
  const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState("");

  async function run(which: "allow" | "deny") {
    setBusy(which);
    setError("");

    const result =
      which === "allow"
        ? await approveAuthorization({
            clientId: props.clientId,
            redirectUri: props.redirectUri,
            codeChallenge: props.codeChallenge,
            state: props.state,
            resource: props.resource,
          })
        : await denyAuthorization({
            clientId: props.clientId,
            redirectUri: props.redirectUri,
            state: props.state,
          });

    if (result.ok && result.redirectTo) {
      window.location.href = result.redirectTo;
      return;
    }

    setError(result.error ?? "That did not work. Start the connection again from Claude.");
    setBusy(null);
  }

  return (
    <div className="w-full">
      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-xs text-amber-200"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2.5">
        <button
          type="button"
          onClick={() => run("deny")}
          disabled={busy !== null}
          className="btn-ghost w-full sm:w-auto min-h-[44px] justify-center disabled:opacity-50"
        >
          {busy === "deny" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          Cancel
        </button>

        <button
          type="button"
          onClick={() => run("allow")}
          disabled={busy !== null}
          className="btn-primary w-full sm:flex-1 min-h-[44px] justify-center disabled:opacity-50"
        >
          {busy === "allow" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          Allow
        </button>
      </div>
    </div>
  );
}
