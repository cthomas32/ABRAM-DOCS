"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { ObjectHeader } from "@/components/admin/ObjectTabs";
import DealFields, {
  DealEvidenceFields,
  dealInputFrom,
  emptyDealFields,
  type AccountOption,
  type ContactOption,
  type DealFieldValues,
} from "../DealFields";
import { createDeal } from "../actions";

/**
 * A new deal, on its own address.
 *
 * The last thing `DealDrawer` was open for. Everything else about a deal
 * moved to `deals/[id]` and the drawer survived on `deal === null`.
 *
 * A NEW DEAL IS ALWAYS AN OPPORTUNITY, and there is no stage control on
 * this page. `createDeal` stamps the stage from the server, along with
 * `owner_user_id`, `sourced_by` and `created_by`, and that last one is
 * the reason it is not a form field: sourcing decides who a commission is
 * owed to and cannot be corrected later without an owner, so it comes
 * from the session rather than from anything typed.
 *
 * Won and lost are not reachable here either. Closing a deal locks its
 * attribution rule and starts a commission clock, so it stays on the
 * record page where it asks for a date and says it cannot be undone.
 *
 * The company is prefilled from `?account=`, which is how a company's own
 * New deal button arrives. It stays a select rather than becoming a fixed
 * label, because arriving from the wrong company is a thing that happens
 * and re-picking beats going back.
 */

export default function DealCreate({
  accounts,
  contacts,
  initialAccountId,
}: {
  accounts: AccountOption[];
  contacts: ContactOption[];
  initialAccountId: string;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<DealFieldValues>(() => emptyDealFields(initialAccountId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DealFieldValues>(key: K, value: DealFieldValues[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const named = Boolean(fields.name.trim());
  const placed = Boolean(fields.accountId);
  const ready = named && placed;

  /* Only the people at the chosen company, once one is chosen. A primary
     contact who works somewhere else is a mistake rather than an option,
     and a select of every person in the CRM is unusable at four hundred
     rows. Contacts carrying no account at all stay listed: they are the
     ones the Companies screen is still asking somebody to file. */
  const pickable = fields.accountId
    ? contacts.filter((entry) => !entry.account_id || entry.account_id === fields.accountId)
    : contacts;

  const accountName = accounts.find((entry) => entry.id === fields.accountId)?.name ?? null;

  async function create() {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);

    const outcome = await createDeal(dealInputFrom(fields));

    if (!outcome.ok || !outcome.dealId) {
      setSaving(false);
      setError(outcome.error ?? "That deal could not be created.");
      return;
    }

    /* Left saving. The redirect is in flight and re-enabling the button
       would invite a second deal on the same company. */
    router.replace(`/admin/dashboard/deals/${outcome.dealId}`);
  }

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && ready && !saving) {
        event.preventDefault();
        void create();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, saving, fields]);

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
          <span className="text-[11px] text-zinc-500 truncate">New deal</span>
        </nav>

        <ObjectHeader title={fields.name.trim() || "New deal"}>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
            {accountName ?? "No company picked yet"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-medium text-zinc-300">
              Opens as Opportunity
            </span>
          </div>
        </ObjectHeader>

        <div className="mt-6 max-w-3xl space-y-7">
          <DealFields fields={fields} set={set} accounts={accounts} contacts={pickable} />
          <DealEvidenceFields
            fields={fields}
            set={set}
            hint="These two are the evidence the attribution rules read. Everything else on this page is description."
          />
        </div>

        <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-zinc-400 leading-relaxed min-w-0">
            {error ? (
              <span className="text-amber-200">{error}</span>
            ) : !named ? (
              "Give the deal a name."
            ) : !placed ? (
              "Pick the company this deal belongs to."
            ) : (
              "You are credited as its source. That part cannot be changed later."
            )}
          </span>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Link
              href="/admin/dashboard/deals"
              className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => void create()}
              disabled={!ready || saving}
              className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {saving ? "Creating" : "Create deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
