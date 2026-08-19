"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Building2,
  ChevronLeft,
  Contact,
  Handshake,
  Loader2,
  Save,
} from "lucide-react";
import ObjectTabs, { ObjectHeader, type ObjectTab } from "@/components/admin/ObjectTabs";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import Money from "@/components/admin/Money";
import { DEAL_STAGES } from "@/lib/crm/constants";
import { formatDate } from "@/lib/crm/console";
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import { accountLifecycleLabel } from "../lifecycles";
import CompanyFields, {
  companyFieldsFrom,
  companyInputFrom,
  companyIsExcluded,
  Field,
  type CompanyFieldValues,
} from "../CompanyFields";
import { setAccountArchived, updateAccount } from "../actions";

/**
 * The company record, drawn on a page.
 *
 * Ported from AccountDrawer, with three changes that are not cosmetic.
 *
 * One save affordance instead of three. The drawer had a Save button per
 * section, which is three chances to lose the change in the section
 * nobody pressed. Typed fields now collect into one form and one sticky
 * bar that says how many things are unsaved, and gestures that are a
 * single click (archive, restore) still commit instantly.
 *
 * The result of a save is stated in the bar that produced it, rather than
 * in a grey box 400px up the page.
 *
 * The people and deals rollups are real queries against this account
 * rather than slices of a map of every account the parent had already
 * loaded.
 *
 * See docs/design/crm-record-pages.md, which this follows to the class.
 *
 * The tab strip is declared here rather than handed down from the page.
 * A tab carries a lucide icon, an icon is a component, and a component
 * cannot cross the server to client boundary: React can only serialise
 * plain data, and the failure is a console error rather than a broken
 * render, which makes it exactly the kind of thing that ships. The page
 * sends the counts, which are numbers.
 */

const TABS: ObjectTab[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "people", label: "People", icon: Contact },
  { id: "deals", label: "Deals", icon: Handshake },
];


export default function CompanyRecord({
  account,
  people,
  deals,
  memberNameById,
  tab,
}: {
  account: CrmAccount;
  people: CrmContact[];
  deals: CrmDeal[];
  memberNameById: Record<string, string>;
  tab: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tabs = useMemo(
    () =>
      TABS.map((entry) =>
        entry.id === "people"
          ? { ...entry, badge: people.length }
          : entry.id === "deals"
            ? { ...entry, badge: deals.length }
            : entry
      ),
    [people.length, deals.length]
  );

  const server = useMemo(() => companyFieldsFrom(account), [account]);
  const [fields, setFields] = useState<CompanyFieldValues>(server);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  /* The count rather than a boolean, so the reader can see they changed
     two things and not one. */
  const dirtyCount = useMemo(
    () =>
      (Object.keys(server) as (keyof CompanyFieldValues)[]).filter((key) => fields[key] !== server[key]).length,
    [fields, server]
  );

  const excluded = companyIsExcluded(fields);

  const set = <K extends keyof CompanyFieldValues>(key: K, value: CompanyFieldValues[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setResult(null);
    const outcome = await updateAccount(account.id, companyInputFrom(fields));
    setSaving(false);
    setResult(outcome.ok ? "Saved." : outcome.error ?? "That did not save.");
    if (outcome.ok) startTransition(() => router.refresh());
  }

  async function toggleArchive() {
    const outcome = await setAccountArchived(account.id, !account.archived);
    setResult(outcome.ok ? (account.archived ? "Restored." : "Archived.") : outcome.error ?? null);
    if (outcome.ok) startTransition(() => router.refresh());
  }

  /* Save on Cmd+S, and only while there is something to save, so the
     browser's own Save keeps working the rest of the time. */
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
            href="/admin/dashboard/companies"
            className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Companies
          </Link>
          <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">
            /
          </span>
          <span className="text-[11px] text-zinc-500 truncate">{account.name}</span>
        </nav>

        <ObjectHeader
          title={account.name}
          action={
            <Link
              href={`/admin/dashboard/deals/new?account=${account.id}`}
              className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
            >
              <Handshake className="w-3.5 h-3.5" />
              New deal
            </Link>
          }
        >
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
            {account.domain || "No web address on file"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Chip>{accountLifecycleLabel(account.lifecycle)}</Chip>
            {excluded && <Chip tone="attention">Pays no commission</Chip>}
            {account.archived && <Chip>Archived</Chip>}
          </div>
        </ObjectHeader>

        <ObjectTabs
          tabs={tabs}
          current={tab}
          basePath={`/admin/dashboard/companies/${account.id}`}
          className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        {tab === "overview" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0 space-y-7">
              <CompanyFields fields={fields} set={set} />
              <section aria-label="Record" className="space-y-3.5">
                <Overline as="h2" className="pb-1 border-b border-white/5">
                  Record
                </Overline>
                <button
                  type="button"
                  onClick={() => void toggleArchive()}
                  className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
                >
                  {account.archived ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  {account.archived ? "Restore" : "Archive"}
                </button>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Archiving hides a company and keeps everything hanging off it. Nothing on this
                  console deletes.
                </p>
              </section>
            </div>

            <div className="min-w-0 space-y-5">
              <section aria-label="Credit" className="space-y-2.5">
                <Overline as="h2">Credit</Overline>
                <dl className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                  <Definition
                    term="Sourced by"
                    value={
                      account.sourced_by
                        ? memberNameById[account.sourced_by] ?? "Somebody who has left"
                        : "Nobody. It walked in."
                    }
                  />
                  <Definition
                    term="Owner"
                    value={
                      account.owner_user_id
                        ? memberNameById[account.owner_user_id] ?? "Somebody who has left"
                        : "Unassigned"
                    }
                  />
                </dl>
              </section>

              <RelatedSection
                label="People"
                seeAllHref={
                  people.length > 5 ? `/admin/dashboard/companies/${account.id}?tab=people` : null
                }
                empty={
                  <EmptyPanel title="Nobody here yet" icon={<Contact className="w-6 h-6" />}>
                    Set this company on a person&apos;s record and they roll up into this list.
                  </EmptyPanel>
                }
                rows={people.slice(0, 5).map((person) => (
                  <PersonRow key={person.id} person={person} />
                ))}
                count={people.length}
              />

              <RelatedSection
                label="Deals"
                seeAllHref={
                  deals.length > 5 ? `/admin/dashboard/companies/${account.id}?tab=deals` : null
                }
                empty={
                  <EmptyPanel title="No deal here yet" icon={<Handshake className="w-6 h-6" />}>
                    Deals created against this company appear here.
                  </EmptyPanel>
                }
                rows={deals.slice(0, 5).map((deal) => (
                  <DealRow key={deal.id} deal={deal} memberNameById={memberNameById} />
                ))}
                count={deals.length}
              />
            </div>
          </div>
        )}

        {tab === "people" && (
          <div className="mt-6">
            {people.length === 0 ? (
              <EmptyPanel title="Nobody here yet" icon={<Contact className="w-6 h-6" />}>
                Set this company on a person&apos;s record and they roll up into this list.
              </EmptyPanel>
            ) : (
              <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                {people.map((person) => (
                  <PersonRow key={person.id} person={person} />
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "deals" && (
          <div className="mt-6">
            {deals.length === 0 ? (
              <EmptyPanel title="No deal here yet" icon={<Handshake className="w-6 h-6" />}>
                Deals created against this company appear here.
              </EmptyPanel>
            ) : (
              <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                {deals.map((deal) => (
                  <DealRow key={deal.id} deal={deal} memberNameById={memberNameById} />
                ))}
              </ul>
            )}
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

/* ------------------------------------------------------------------ */
/*  Small parts                                                        */
/* ------------------------------------------------------------------ */

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "attention";
}) {
  const skin =
    tone === "attention"
      ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
      : "bg-white/[0.04] text-zinc-300 border-white/8";
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[10px] font-medium ${skin}`}
    >
      {children}
    </span>
  );
}



function Definition({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <dt className="text-[11px] text-zinc-400 shrink-0">{term}</dt>
      <dd className="text-xs text-white text-right break-words min-w-0">{value}</dd>
    </div>
  );
}

function RelatedSection({
  label,
  rows,
  empty,
  seeAllHref,
  count,
}: {
  label: string;
  rows: React.ReactNode[];
  empty: React.ReactNode;
  seeAllHref: string | null;
  count: number;
}) {
  return (
    <section aria-label={label} className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Overline as="h2">{label}</Overline>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            See all {count}
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        empty
      ) : (
        <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
          {rows}
        </ul>
      )}
    </section>
  );
}

function PersonRow({ person }: { person: CrmContact }) {
  const supporting = [person.job_title, person.email].filter(Boolean).join(" · ");
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
        <Contact className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/admin/dashboard/people/${person.id}`}
            className="text-xs text-white break-words hover:underline"
          >
            {person.full_name}
          </Link>
        </span>
        <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words">
          {supporting || "No job title or email"}
        </span>
      </span>
    </li>
  );
}

function DealRow({
  deal,
  memberNameById,
}: {
  deal: CrmDeal;
  memberNameById: Record<string, string>;
}) {
  const stage = DEAL_STAGES.find((entry) => entry.id === deal.stage);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
        <Handshake className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/admin/dashboard/deals/${deal.id}`}
            className="text-xs text-white break-words hover:underline"
          >
            {deal.name}
          </Link>
          {stage && (
            <span
              className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-medium ${stage.badge}`}
            >
              {stage.label}
            </span>
          )}
        </span>
        <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words">
          {deal.owner_user_id
            ? memberNameById[deal.owner_user_id] ?? "Somebody who has left"
            : "Unassigned"}
          {deal.expected_close_on ? ` · closes ${formatDate(deal.expected_close_on)}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">
        <Money cents={deal.amount_cents} currency={deal.currency} />
      </span>
    </li>
  );
}
