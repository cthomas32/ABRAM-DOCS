"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Loader2 } from "lucide-react";

/**
 * Create a discount campaign.
 *
 * A full page rather than a dialog. The form carries eleven decisions, several of which change
 * which other fields exist at all (months_free forces the interval, extended_trial removes the
 * duration question), and a panel that reflows under you inside a scrolling modal is where people
 * stop reading and start clicking. The page also has room for the two things that actually prevent
 * a bad campaign: the plain-English restatement of the offer, and the money warnings.
 *
 * Nothing here is authoritative. Every rule is enforced server-side by admin-promotions and by
 * CHECK constraints on promo_campaigns — this page's job is to make the choice legible, not to
 * guarantee it.
 */

type OfferType = "percent_off" | "amount_off" | "months_free" | "extended_trial";

const TIERS = [
  { id: "solo_lite", label: "Solo Lite" },
  { id: "solo_pro", label: "Solo Pro" },
  { id: "team", label: "Team" },
  { id: "studio", label: "Studio" },
];

const OFFER_TYPES: Array<{ id: OfferType; label: string; blurb: string }> = [
  {
    id: "percent_off",
    label: "% off",
    blurb: "The workhorse. The card is charged the reduced amount from the first invoice.",
  },
  {
    id: "months_free",
    label: "Months free",
    blurb:
      "The strongest acquisition offer: a card is collected up front and it converts to paid on its own. Monthly billing only.",
  },
  {
    id: "amount_off",
    label: "$ off",
    blurb: "A fixed amount off. Best on the first invoice, when the promise is a specific dollar figure.",
  },
  {
    id: "extended_trial",
    label: "Extended trial",
    blurb: "Free days with a card collected up front. Nothing is charged until the trial ends.",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("percent_off");
  const [percentOff, setPercentOff] = useState("50");
  const [amountOff, setAmountOff] = useState("20");
  const [months, setMonths] = useState("3");
  const [trialDays, setTrialDays] = useState("30");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("repeating");
  const [tiers, setTiers] = useState<string[]>([]);
  const [annualAllowed, setAnnualAllowed] = useState(true);
  const [newOnly, setNewOnly] = useState(true);
  const [endsAt, setEndsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Derived, not typed: the slug is the join key to the marketing campaign of the same name, and a
  // hand-typed one drifts the first time somebody capitalises differently.
  const slug = useMemo(
    () =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 63),
    [name],
  );

  const monthsFree = offerType === "months_free";
  const isForever = offerType !== "extended_trial" && duration === "forever";
  const showMonths = (monthsFree || duration === "repeating") && offerType !== "extended_trial";

  /** Mirrors describeOffer() in the network's _shared/promotions.ts. */
  const preview = useMemo(() => {
    const scope = tiers.length ? tiers.map((t) => TIERS.find((x) => x.id === t)?.label ?? t).join(", ") : "any paid plan";
    const window =
      duration === "forever" ? "for the life of the subscription"
      : duration === "repeating" ? `for ${months || "?"} months`
      : "on the first invoice";

    switch (offerType) {
      case "percent_off":
        return `${percentOff || "?"}% off ${scope} ${window}`;
      case "amount_off":
        return `$${amountOff || "?"} off ${scope} ${window}`;
      case "months_free":
        return `${months || "?"} months free on ${scope}, billed monthly`;
      case "extended_trial":
        return `${trialDays || "?"}-day free trial of ${scope}`;
    }
  }, [offerType, percentOff, amountOff, months, trialDays, duration, tiers]);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_campaign",
          slug,
          name: name.trim(),
          offerType,
          percentOff: offerType === "percent_off" ? Number(percentOff) : undefined,
          amountOffCents: offerType === "amount_off" ? Math.round(Number(amountOff) * 100) : undefined,
          durationInMonths: showMonths ? Number(months) : undefined,
          duration: monthsFree ? "repeating" : offerType === "extended_trial" ? undefined : duration,
          trialDays: offerType === "extended_trial" ? Number(trialDays) : undefined,
          eligibleTiers: tiers,
          eligibleIntervals: monthsFree ? ["monthly"] : annualAllowed ? ["monthly", "annual"] : ["monthly"],
          newCustomersOnly: newOnly,
          endsAt: endsAt || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);

      // Straight to the list, where the next step — minting a code — actually lives. A campaign
      // with no codes is not yet an offer, so leaving the user on a success screen would be
      // leaving them one click short of a working thing.
      router.push("/admin/dashboard/promotions");
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  };

  const blocked = !name.trim() || !slug || saving || (isForever && !endsAt);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="bg-[#0C0C0C] border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0 z-10">
        <Link
          href="/admin/dashboard/promotions"
          className="btn-glass px-3 h-9 flex items-center gap-1.5 text-xs font-semibold rounded-full font-sans shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Promotions</span>
        </Link>
        <span className="text-zinc-600 text-xs hidden sm:inline">/</span>
        <span className="hidden sm:block text-xs font-semibold text-zinc-400 truncate max-w-xs">
          {name || "New campaign"}
        </span>

        <div className="ml-auto shrink-0">
          <button
            onClick={() => void submit()}
            disabled={blocked}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full disabled:opacity-40 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create draft
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-16">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">New campaign</h1>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Created as a draft. Nothing is redeemable until you mint a code and activate it.
            </p>
          </div>

          <Section title="What is it called">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Launch 2026 — 50% off Team"
                className="admin-input"
                autoFocus
              />
              {slug && <p className="text-[11px] text-zinc-600 mt-1.5 font-mono">{slug}</p>}
            </Field>
          </Section>

          <Section title="The offer">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {OFFER_TYPES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setOfferType(o.id);
                    if (o.id === "months_free") setDuration("repeating");
                  }}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    offerType === o.id ? "border-white/25 bg-white/[0.06]" : "border-white/10 hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="text-xs font-medium text-white block">{o.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
              {OFFER_TYPES.find((o) => o.id === offerType)?.blurb}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              {offerType === "percent_off" && (
                <Field label="Percent off">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={percentOff}
                    onChange={(e) => setPercentOff(e.target.value)}
                    className="admin-input"
                  />
                </Field>
              )}

              {offerType === "amount_off" && (
                <Field label="Dollars off">
                  <input
                    type="number"
                    min={1}
                    value={amountOff}
                    onChange={(e) => setAmountOff(e.target.value)}
                    className="admin-input"
                  />
                </Field>
              )}

              {offerType === "extended_trial" && (
                <Field label="Trial days">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="admin-input"
                  />
                </Field>
              )}

              {(offerType === "percent_off" || offerType === "amount_off") && (
                <Field label="Runs for">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as typeof duration)}
                    className="admin-input"
                  >
                    <option value="once">The first invoice</option>
                    <option value="repeating">N months</option>
                    {offerType === "percent_off" && (
                      <option value="forever">The life of the subscription</option>
                    )}
                  </select>
                </Field>
              )}

              {showMonths && (
                <Field label="Months">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="admin-input"
                  />
                </Field>
              )}
            </div>
          </Section>

          <Section title="Who can use it">
            <Field label="Plans">
              <div className="flex flex-wrap gap-2">
                {TIERS.map((t) => {
                  const on = tiers.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setTiers((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))
                      }
                      className={`h-9 px-3.5 text-xs font-medium rounded-lg border transition-colors ${
                        on ? "border-white/25 bg-white/[0.08] text-white" : "border-white/10 text-zinc-400 hover:bg-white/[0.03]"
                      }`}
                    >
                      {on && <Check className="w-3 h-3 inline mr-1.5" />}
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2">
                {tiers.length === 0 ? "Any paid plan. Free and Enterprise are never eligible." : "Only the plans selected."}
              </p>
            </Field>

            <div className="space-y-4 mt-5">
              {monthsFree ? (
                <Callout>
                  Monthly billing only, and the product enforces it. On an annual price, N months free
                  discounts the single yearly invoice — you would be giving away a whole year.
                </Callout>
              ) : (
                <Toggle on={annualAllowed} onChange={setAnnualAllowed} label="Valid on annual billing too" />
              )}

              <Toggle
                on={newOnly}
                onChange={setNewOnly}
                label="New customers only"
                hint="Blocks anyone who has ever held a paid subscription. Leave on for acquisition; turn off for win-back and upgrade offers."
              />
            </div>
          </Section>

          <Section title="When it stops">
            <Field label={isForever ? "Redeemable until (required)" : "Redeemable until"}>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="admin-input sm:max-w-xs"
              />
              <p className="text-[11px] text-zinc-600 mt-1.5 leading-relaxed">
                After this date the code stops being redeemable. Discounts already running are unaffected —
                someone who redeemed keeps what they were sold.
              </p>
            </Field>

            {isForever && !endsAt && (
              <Callout className="mt-4">
                A lifetime discount needs a redemption deadline. Without one it is a permanent hole in the
                price list, and the product will refuse to create it.
              </Callout>
            )}
          </Section>

          <Section title="Why it exists">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What this offer is for, and what would make you renew it."
                className="admin-input resize-none"
              />
            </Field>
          </Section>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans block mb-1.5">
              This reads as
            </span>
            <p className="text-sm text-white font-sans">{preview}</p>
            <p className="text-[11px] text-zinc-600 mt-2">
              {newOnly ? "New customers only. " : ""}
              One redemption per workspace.
            </p>
          </div>

          {err && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">{err}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Link
              href="/admin/dashboard/promotions"
              className="h-9 px-4 text-xs font-medium rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors flex items-center"
            >
              Cancel
            </Link>
            <button
              onClick={() => void submit()}
              disabled={blocked}
              className="btn-primary h-9 px-4 text-xs font-semibold rounded-full disabled:opacity-40 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">{title}</h2>
      <div className="glass-panel rounded-2xl border border-white/5 p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Callout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.03] p-3 flex gap-2.5 ${className}`}>
      <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
      <p className="text-[11px] text-zinc-400 leading-relaxed">{children}</p>
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-start gap-3 text-left w-full">
      <span
        className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          on ? "border-white/40 bg-white/15" : "border-white/15"
        }`}
      >
        {on && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="min-w-0">
        <span className="text-xs text-white font-sans block">{label}</span>
        {hint && <span className="text-[11px] text-zinc-600 leading-relaxed block mt-0.5">{hint}</span>}
      </span>
    </button>
  );
}
