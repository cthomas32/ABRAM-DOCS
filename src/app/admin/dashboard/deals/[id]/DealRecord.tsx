"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Contact,
  Handshake,
  Loader2,
  RefreshCw,
  Save,
  Stamp,
  XCircle,
} from "lucide-react";
import ObjectTabs, { ObjectHeader, type ObjectTab } from "@/components/admin/ObjectTabs";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import { EmptyPanel } from "@/components/admin/Panel";
import Money from "@/components/admin/Money";
import AttributionVerdict from "@/components/crm/AttributionVerdict";
import type { AttributionVerdict as Verdict } from "@/lib/crm/attribution";
import {
  BILLING_PERIODS,
  CRM_MOTIONS,
  DEAL_STAGES,
  attributionSpec,
  type BillingPeriod,
  type CrmMotion,
  type DealStage,
} from "@/lib/crm/constants";
import { formatDate } from "@/lib/crm/console";
import DealFields, {
  DealEvidenceFields,
  dealFieldsFrom,
  dealInputFrom,
  type AccountOption,
  type ContactOption,
  type DealFieldValues,
} from "../DealFields";

/* Re-exported because the page that renders this component imports them
   from here, and they are one definition in ../DealFields. */
export type { AccountOption, ContactOption };
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import type { DealAttributionResult } from "@/lib/crm/attributionService";
import {
  markLost,
  markWon,
  recheckDealAttribution,
  setDealStage,
  updateDeal,
} from "../actions";

/**
 * The deal record, drawn on a page.
 *
 * Two things here survive from the drawer unchanged because they are
 * load bearing, and both are worth reading before touching this file.
 *
 * Closing is a two step. The database will not let a won deal be
 * un-won, so Mark won arms a block that asks for the close date and
 * nothing about it is a single click. That block is drawn at the top of
 * the left column rather than in a popover, so the thing you are about
 * to do irreversibly is on the page you are reading.
 *
 * The attribution panel has nothing to change on it. Attribution is
 * derived from evidence, and the only way to move it is to change the
 * evidence: link a promo code, correct a tracked source, approve a
 * registration. A dropdown here would be the discretionary override the
 * partnership agreement rules out.
 *
 * The recheck result is held in client state rather than saved, because
 * it carries the list of rules that did not fire and the stored columns
 * cannot reproduce that. A deal knows which rule won. It does not know
 * what the others said.
 */

/**
 * The tab strip is declared here rather than handed down from the page.
 *
 * A tab carries a lucide icon, an icon is a component, and a component
 * cannot cross the server to client boundary: React serialises plain data
 * only. The failure is a console error rather than a broken render, which
 * makes it exactly the kind of thing that ships unnoticed.
 */
const TABS: ObjectTab[] = [
  { id: "overview", label: "Overview", icon: Handshake },
  { id: "attribution", label: "Attribution", icon: Stamp },
];


function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DealRecord({
  deal,
  account,
  primaryContact,
  accounts,
  contacts,
  memberNameById,
  tab,
}: {
  deal: CrmDeal;
  account: CrmAccount | null;
  primaryContact: CrmContact | null;
  accounts: AccountOption[];
  contacts: ContactOption[];
  memberNameById: Record<string, string>;
  tab: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const server = useMemo(() => dealFieldsFrom(deal), [deal]);
  const [fields, setFields] = useState<DealFieldValues>(server);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState<"stage" | "won" | "lost" | "attribution" | null>(null);
  const [arming, setArming] = useState<"won" | "lost" | null>(null);
  const [closedOn, setClosedOn] = useState(today());
  const [lostReason, setLostReason] = useState("");
  const [fresh, setFresh] = useState<DealAttributionResult | null>(null);

  const dirtyCount = useMemo(
    () =>
      (Object.keys(server) as (keyof DealFieldValues)[]).filter((key) => fields[key] !== server[key]).length,
    [fields, server]
  );

  const set = <K extends keyof DealFieldValues>(key: K, value: DealFieldValues[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const stage = DEAL_STAGES.find((entry) => entry.id === deal.stage) ?? DEAL_STAGES[0];
  const settled = deal.stage === "won" || deal.stage === "lost";
  const rule = attributionSpec(deal.attribution_rule ?? "unattributed");

  /**
   * What the panel draws. A fresh recheck wins, because it carries the
   * rejection list. With no recheck in hand the stored columns are shown
   * with an empty rejection list, because the deal knows which rule fired
   * and not what the others said, and pretending otherwise would be
   * inventing history.
   */
  const shownVerdict: Verdict | null = fresh?.verdict
    ? fresh.verdict
    : deal.attribution_rule
      ? {
          rule: deal.attribution_rule,
          userId: deal.sourced_by ?? null,
          ref: deal.attribution_ref ?? null,
          reason: deal.attribution_note ?? rule.description,
          rejected: [],
        }
      : null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function save() {
    setSaving(true);
    setResult(null);
    const outcome = await updateDeal(deal.id, dealInputFrom(fields));
    setSaving(false);
    setResult(outcome.ok ? "Saved." : outcome.error ?? "That did not save.");
    if (outcome.ok) refresh();
  }

  async function moveStage(next: DealStage) {
    setBusy("stage");
    const outcome = await setDealStage(deal.id, next);
    setBusy(null);
    setResult(outcome.ok ? null : outcome.error ?? "That move did not save.");
    if (outcome.ok) refresh();
  }

  async function confirmWon() {
    setBusy("won");
    const outcome = await markWon(deal.id, { closedOn });
    setBusy(null);
    setArming(null);
    setResult(outcome.ok ? outcome.warning ?? "Recorded as won." : outcome.error ?? null);
    if (outcome.ok) refresh();
  }

  async function confirmLost() {
    setBusy("lost");
    const outcome = await markLost(deal.id, lostReason);
    setBusy(null);
    setArming(null);
    setResult(outcome.ok ? "Recorded as lost." : outcome.error ?? null);
    if (outcome.ok) refresh();
  }

  async function recheck() {
    setBusy("attribution");
    const outcome = await recheckDealAttribution(deal.id);
    setBusy(null);
    setFresh(outcome);
    if (outcome.ok && outcome.changed) refresh();
  }

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && dirtyCount > 0) {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyCount, fields]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <Link
            href="/admin/dashboard/deals"
            className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Deals
          </Link>
          <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">
            /
          </span>
          <span className="text-[11px] text-zinc-500 truncate">{deal.name}</span>
        </nav>

        <ObjectHeader
          title={deal.name}
          action={
            settled ? undefined : (
              <>
                <button
                  type="button"
                  onClick={() => setArming(arming === "won" ? null : "won")}
                  className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark won
                </button>
                <button
                  type="button"
                  onClick={() => setArming(arming === "lost" ? null : "lost")}
                  className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark lost
                </button>
              </>
            )
          }
        >
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
            {account?.name ?? "No company"}
            {deal.expected_close_on ? ` · Closes ${formatDate(deal.expected_close_on)}` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[10px] font-medium ${stage.badge}`}
            >
              {stage.label}
            </span>
            <span
              className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[10px] font-medium ${rule.badge}`}
            >
              {rule.label}
            </span>
            {deal.amount_cents > 0 && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-medium text-zinc-300 tabular-nums">
                <Money cents={deal.amount_cents} currency={deal.currency} />
              </span>
            )}
          </div>
        </ObjectHeader>

        <ObjectTabs
          tabs={TABS}
          current={tab}
          basePath={`/admin/dashboard/deals/${deal.id}`}
          className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        {tab === "overview" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0 space-y-7">
              {arming === "won" && (
                <section
                  aria-label="Record the close"
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3"
                >
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    The commission ledger keys a collection month off this date, so it decides which
                    month anything on this deal is paid in. A won deal cannot be un-won.
                  </p>
                  <div>
                    <FieldLabel htmlFor="deal-closed-on">Close date</FieldLabel>
                    <input
                      id="deal-closed-on"
                      type="date"
                      max={today()}
                      value={closedOn}
                      onChange={(event) => setClosedOn(event.target.value)}
                      className="admin-input h-11 sm:h-9 py-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === "won"}
                      onClick={() => void confirmWon()}
                      className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {busy === "won" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Record the close
                    </button>
                    <button
                      type="button"
                      onClick={() => setArming(null)}
                      className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              )}

              {arming === "lost" && (
                <section
                  aria-label="Record it as lost"
                  className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3"
                >
                  <div>
                    <FieldLabel htmlFor="deal-lost-reason">Why it was lost</FieldLabel>
                    <input
                      id="deal-lost-reason"
                      value={lostReason}
                      onChange={(event) => setLostReason(event.target.value)}
                      placeholder="Went with an in-house build"
                      className="admin-input h-11 sm:h-9 py-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === "lost"}
                      onClick={() => void confirmLost()}
                      className="btn-danger min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {busy === "lost" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Record it as lost
                    </button>
                    <button
                      type="button"
                      onClick={() => setArming(null)}
                      className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              )}

              <section aria-label="Stage" className="space-y-3.5">
                <Overline as="h2" className="pb-1 border-b border-white/5">
                  Stage
                </Overline>
                <div
                  role="group"
                  aria-label="Deal stage"
                  className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-full border border-white/8 bg-white/[0.02]"
                >
                  {DEAL_STAGES.filter((entry) => !entry.terminal).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={busy === "stage" || settled}
                      aria-pressed={deal.stage === entry.id}
                      onClick={() => void moveStage(entry.id)}
                      className={`inline-flex items-center h-10 sm:h-8 px-3.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        deal.stage === entry.id
                          ? "bg-white text-black"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>

                {deal.stage === "won" && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Closed {formatDate(deal.closed_at)}
                    {deal.closed_by
                      ? ` by ${memberNameById[deal.closed_by] ?? "somebody who has left"}`
                      : ""}
                    .
                  </p>
                )}
                {deal.stage === "lost" && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {deal.lost_reason || "No reason recorded."}
                  </p>
                )}
              </section>

              <DealFields fields={fields} set={set} accounts={accounts} contacts={contacts} />
              <section aria-label="Company" className="space-y-2.5">
                <Overline as="h2">Company</Overline>
                {account ? (
                  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                    <li className="flex items-start gap-3 px-4 py-3">
                      <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/admin/dashboard/companies/${account.id}`}
                          className="text-xs text-white break-words hover:underline"
                        >
                          {account.name}
                        </Link>
                        <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words">
                          {account.domain || "No web address on file"}
                        </span>
                      </span>
                    </li>
                  </ul>
                ) : (
                  <EmptyPanel title="No company" icon={<Building2 className="w-6 h-6" />}>
                    Every deal hangs off a company. This one names an account that cannot be read.
                  </EmptyPanel>
                )}
              </section>

              <section aria-label="Primary contact" className="space-y-2.5">
                <Overline as="h2">Primary contact</Overline>
                {primaryContact ? (
                  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                    <li className="flex items-start gap-3 px-4 py-3">
                      <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
                        <Contact className="w-3.5 h-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/admin/dashboard/people/${primaryContact.id}`}
                          className="text-xs text-white break-words hover:underline"
                        >
                          {primaryContact.full_name}
                        </Link>
                        <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words">
                          {[primaryContact.job_title, primaryContact.email]
                            .filter(Boolean)
                            .join(" · ") || "No job title or email"}
                        </span>
                      </span>
                    </li>
                  </ul>
                ) : (
                  <EmptyPanel title="Nobody named yet" icon={<Contact className="w-6 h-6" />}>
                    Name the person who takes the meeting. It is regularly not the person who signs.
                  </EmptyPanel>
                )}
              </section>
            </div>
          </div>
        )}

        {tab === "attribution" && (
          <div className="mt-6 max-w-3xl space-y-7">
            <AttributionVerdict
              verdict={shownVerdict}
              locked={Boolean(deal.attribution_locked_at)}
              warnings={fresh?.warnings ?? []}
              action={
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={busy === "attribution"}
                    onClick={() => void recheck()}
                    className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-[11px] font-medium rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {busy === "attribution" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Recheck attribution
                  </button>
                  {deal.attribution_locked_at && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Settled {formatDate(deal.attribution_locked_at)}. The ledger reads this rather
                      than working it out again.
                    </p>
                  )}
                  {fresh && !fresh.ok && fresh.error && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{fresh.error}</p>
                  )}
                </div>
              }
            />

            <DealEvidenceFields
              fields={fields}
              set={set}
              hint="These two are the evidence the rules read. Save the deal after changing them, then recheck."
            />
            <section aria-label="Credit" className="space-y-2.5">
              <Overline as="h2">Credit</Overline>
              <dl className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                <Definition
                  term="Sourced by"
                  value={
                    deal.sourced_by
                      ? memberNameById[deal.sourced_by] ?? "Somebody who has left"
                      : "Nobody. It walked in."
                  }
                  hint="Set once when the deal was created. Only an owner can move it."
                />
                <Definition
                  term="Owner"
                  value={
                    deal.owner_user_id
                      ? memberNameById[deal.owner_user_id] ?? "Somebody who has left"
                      : "Unassigned"
                  }
                />
                <Definition
                  term="Closed by"
                  value={
                    deal.closed_by
                      ? memberNameById[deal.closed_by] ?? "Somebody who has left"
                      : "Not closed yet"
                  }
                />
              </dl>
            </section>
          </div>
        )}

        {(dirtyCount > 0 || result) && (
          <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-zinc-400 tabular-nums min-w-0">
              {dirtyCount > 0
                ? `${dirtyCount} unsaved ${dirtyCount === 1 ? "change" : "changes"}`
                : "No unsaved changes"}
              {result && <span className="text-zinc-300"> · {result}</span>}
            </span>
            {dirtyCount > 0 && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFields(server);
                    setResult(null);
                  }}
                  className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || pending}
                  className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : "Save"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Definition({ term, value, hint }: { term: string; value: string; hint?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[11px] text-zinc-400 shrink-0">{term}</dt>
        <dd className="text-xs text-white text-right break-words min-w-0">{value}</dd>
      </div>
      {hint && <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">{hint}</p>}
    </div>
  );
}
