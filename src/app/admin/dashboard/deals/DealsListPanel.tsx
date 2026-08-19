"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Handshake, Loader2, Plus, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { can, type ConsoleRole, type GrowthStage } from "@/lib/auth/permissions";
import {
  CRM_MOTIONS,
  DEAL_STAGES,
  attributionSpec,
  formatMoney,
  type CrmMotion,
  type DealStage,
} from "@/lib/crm/constants";
import type { CrmDeal } from "@/lib/crm/types";
import type { AccountOption } from "./DealFields";
import { rows, readWarning } from "@/lib/supabase/rows";
import { StatRow } from "@/components/admin/StatTile";
import Money from "@/components/admin/Money";
import FilterBar, { type FilterSpec } from "@/components/admin/FilterBar";
import DataTable, { BulkBar, type Column } from "@/components/admin/DataTable";
import { downloadFile, stampedFilename } from "@/lib/crm/console";
import { AMOUNT_BANDS, dealsToCsv } from "./csv";

/**
 * Every deal, and what each one is worth.
 *
 * The list is the whole screen rather than a tab, because the question it
 * answers is asked on its own: what is open, what is it worth, and what
 * is meant to close this month. Row level security decides which rows
 * arrive, so no owner filter is applied to the query. The filters here
 * narrow what is already permitted, they do not grant anything.
 *
 * Sorting is client side on purpose. A growth team of three has hundreds
 * of deals, not hundreds of thousands, and a round trip per column click
 * is a worse trade than holding them in memory.
 */

interface MemberRow {
  user_id: string;
  full_name: string | null;
  email: string;
  role: ConsoleRole;
  growth_stage: GrowthStage | null;
  is_active: boolean;
}

const ALL = "all";

function monthKey(iso: string | null): string | null {
  return iso ? iso.slice(0, 7) : null;
}

function monthLabel(key: string): string {
  const parsed = new Date(`${key}-01T12:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? key
    : parsed.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatDay(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? "No date"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function DealsListPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [canManage, setCanManage] = useState(false);

  const [stage, setStage] = useState<DealStage | typeof ALL>(ALL);
  const [owner, setOwner] = useState<string>(ALL);
  const [motion, setMotion] = useState<CrmMotion | typeof ALL>(ALL);
  const [closeMonth, setCloseMonth] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [amountBand, setAmountBand] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    const supabase = createClient();

    const [dealRows, accountRows, memberRows, session] = await Promise.all([
      supabase.from("crm_deals").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase
        .from("crm_accounts")
        .select("id, name, domain")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(500),
      supabase
        .from("admin_users")
        .select("user_id, full_name, email, role, growth_stage, is_active"),
      supabase.auth.getUser(),
    ]);

    setWarning(readWarning(dealRows, "Deals"));

    setDeals(rows<CrmDeal>(dealRows));
    setAccounts(rows<AccountOption>(accountRows));

    const people = rows<MemberRow>(memberRows);
    setMembers(people);

    const me = people.find((person) => person.user_id === session.data.user?.id);
    setCanManage(
      Boolean(
        me &&
          can(
            {
              role: me.role,
              growthStage: me.growth_stage,
              isActive: me.is_active,
            },
            "crm.deals.manage"
          )
      )
    );

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const memberNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const person of members) map[person.user_id] = person.full_name || person.email;
    return map;
  }, [members]);

  const accountNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const account of accounts) map[account.id] = account.name;
    return map;
  }, [accounts]);

  /** Only people who actually hold a deal, so the filter has no dead options. */
  const ownerOptions = useMemo(() => {
    const held = new Set(deals.map((deal) => deal.owner_user_id).filter(Boolean) as string[]);
    return members.filter((person) => held.has(person.user_id));
  }, [deals, members]);

  const closeMonths = useMemo(() => {
    const keys = new Set<string>();
    for (const deal of deals) {
      const key = monthKey(deal.expected_close_on);
      if (key) keys.add(key);
    }
    return Array.from(keys).sort();
  }, [deals]);

  /**
   * The filtered set.
   *
   * Sorting is not here any more: the table owns it, because the table is
   * the thing with the column headers somebody presses. What is left is
   * the filter, and it is deliberately the same shape as the people
   * screen's so the two bars behave identically.
   */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const [floor, ceiling] = AMOUNT_BANDS.find((band) => band.value === amountBand)?.range ?? [
      null,
      null,
    ];

    return deals.filter((deal) => {
      if (stage !== ALL && deal.stage !== stage) return false;
      if (owner !== ALL && deal.owner_user_id !== owner) return false;
      if (motion !== ALL && deal.motion !== motion) return false;
      if (closeMonth !== ALL && monthKey(deal.expected_close_on) !== closeMonth) return false;
      if (floor !== null && deal.amount_cents < floor) return false;
      if (ceiling !== null && deal.amount_cents >= ceiling) return false;
      if (needle) {
        const haystack = `${deal.name} ${accountNameById[deal.account_id] ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [deals, stage, owner, motion, closeMonth, amountBand, query, accountNameById]);

  const totals = useMemo(() => {
    const open = visible.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
    return {
      count: visible.length,
      openValue: open.reduce((sum, deal) => sum + deal.amount_cents, 0),
      openMrr: open.reduce((sum, deal) => sum + deal.mrr_cents, 0),
      currency: visible[0]?.currency ?? "USD",
    };
  }, [visible]);

  /**
   * Arriving from the command palette with a row already chosen.
   *
   * Read once, after the first load, and only when the id is one the
   * reader may actually see — row level security decided that, and a
   * guessed id in the address bar must not open an empty drawer that
   * looks like a record.
   */
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  useEffect(() => {
    if (deepLinkDone || loading) return;
    setDeepLinkDone(true);
    const wanted = new URLSearchParams(window.location.search).get("deal");
    if (wanted && deals.some((row) => row.id === wanted)) {
      // A deal has its own address now. The query form forwards to it and
      // replaces, so it does not sit in the back stack.
      router.replace(`/admin/dashboard/deals/${wanted}`);
    }
  }, [deepLinkDone, loading, deals, router]);

  const anyFilter =
    stage !== ALL ||
    owner !== ALL ||
    motion !== ALL ||
    closeMonth !== ALL ||
    amountBand !== "" ||
    query.trim() !== "";

  /** Whatever is ticked, or whatever is on screen when nothing is. */
  const exportSet = useMemo(
    () => (selectedIds.size > 0 ? visible.filter((deal) => selectedIds.has(deal.id)) : visible),
    [visible, selectedIds]
  );

  const chipValues = useMemo<Record<string, string | boolean | undefined>>(
    () => ({
      stage: stage === ALL ? "" : stage,
      owner: owner === ALL ? "" : owner,
      motion: motion === ALL ? "" : motion,
      closeMonth: closeMonth === ALL ? "" : closeMonth,
      amount: amountBand,
    }),
    [stage, owner, motion, closeMonth, amountBand]
  );

  const setChip = useCallback((id: string, value: string | boolean | undefined) => {
    const text = typeof value === "string" ? value : "";
    if (id === "stage") setStage((text || ALL) as DealStage | typeof ALL);
    else if (id === "owner") setOwner(text || ALL);
    else if (id === "motion") setMotion((text || ALL) as CrmMotion | typeof ALL);
    else if (id === "closeMonth") setCloseMonth(text || ALL);
    else if (id === "amount") setAmountBand(text);
  }, []);

  const clearFilters = useCallback(() => {
    setStage(ALL);
    setOwner(ALL);
    setMotion(ALL);
    setCloseMonth(ALL);
    setAmountBand("");
    setQuery("");
  }, []);

  const dealFilterSpecs = useMemo<FilterSpec[]>(
    () => [
      {
        id: "stage",
        label: "Stage",
        kind: "select",
        options: DEAL_STAGES.map((option) => ({ value: option.id, label: option.label })),
      },
      {
        id: "owner",
        label: "Owner",
        kind: "select",
        options: ownerOptions.map((person) => ({
          value: person.user_id,
          label: person.full_name || person.email,
        })),
      },
      {
        id: "motion",
        label: "Motion",
        kind: "select",
        options: CRM_MOTIONS.map((option) => ({ value: option.id, label: option.label })),
      },
      {
        id: "closeMonth",
        label: "Closing",
        kind: "select",
        options: closeMonths.map((key) => ({ value: key, label: monthLabel(key) })),
      },
      {
        id: "amount",
        label: "Amount",
        kind: "select",
        hint: "The forecast value on the deal, not cash collected.",
        options: AMOUNT_BANDS.map((band) => ({ value: band.value, label: band.label })),
      },
    ],
    [ownerOptions, closeMonths]
  );

  /**
   * Reassigning a screenful.
   *
   * `owner_user_id` only. `sourced_by` is write-once and the database
   * refuses to move it, which is the point: who found a deal is what the
   * commission ledger pays on, and it must not be reassignable by a
   * checkbox and a dropdown.
   */
  const assignOwners = useCallback(
    async (ownerUserId: string | null) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("crm_deals")
        .update({ owner_user_id: ownerUserId })
        .in("id", [...selectedIds]);

      setWarning(error ? "That reassignment did not save. Try again." : null);
      if (!error) {
        setSelectedIds(new Set());
        void load(true);
      }
    },
    [selectedIds, load]
  );

  /** One field on one deal, written from the table. */
  const patchDeal = useCallback(
    async (deal: CrmDeal, patch: Partial<CrmDeal>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("crm_deals")
        .update(patch)
        .eq("id", deal.id)
        .select("*")
        .single();

      if (error || !data) {
        setWarning(
          "That change did not save. A deal moved to won needs a closer and a close date, which the drawer asks for."
        );
        return;
      }
      setDeals((prev) => prev.map((row) => (row.id === data.id ? (data as CrmDeal) : row)));
    },
    []
  );

  const dealColumns = useMemo<Column<CrmDeal>[]>(
    () => [
      {
        id: "name",
        label: "Deal",
        fixed: true,
        sortValue: (deal) => deal.name.toLowerCase(),
        render: (deal) => (
          <span className="block">
            <span className="block text-xs text-white truncate">{deal.name}</span>
            <span className="block text-[11px] text-zinc-500 truncate">
              {accountNameById[deal.account_id] ?? "No company"}
            </span>
          </span>
        ),
      },
      {
        id: "stage",
        label: "Stage",
        sortValue: (deal) => DEAL_STAGES.findIndex((entry) => entry.id === deal.stage),
        render: (deal) =>
          canManage ? (
            <select
              value={deal.stage}
              onChange={(event) => {
                const next = event.target.value as DealStage;
                // Winning needs a closer and a close date together, which
                // the drawer collects. Sending it from a cell would fail
                // the constraint and read as a broken table.
                if (next === "won") {
                  openDeal(deal.id);
                  return;
                }
                void patchDeal(deal, { stage: next });
              }}
              aria-label={`Stage of ${deal.name}`}
              className="bg-transparent border border-white/10 rounded-md h-7 px-1.5 text-[11px] text-zinc-200 cursor-pointer hover:border-white/25"
            >
              {DEAL_STAGES.map((option) => (
                <option key={option.id} value={option.id} className="bg-zinc-950">
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            DEAL_STAGES.find((entry) => entry.id === deal.stage)?.label ?? deal.stage
          ),
      },
      {
        id: "amount",
        label: "Amount",
        numeric: true,
        sortValue: (deal) => deal.amount_cents,
        render: (deal) => <Money cents={deal.amount_cents} currency={deal.currency} />,
      },
      {
        id: "mrr",
        label: "MRR",
        numeric: true,
        sortValue: (deal) => deal.mrr_cents,
        render: (deal) => <Money cents={deal.mrr_cents} currency={deal.currency} />,
      },
      {
        id: "close",
        label: "Closing",
        sortValue: (deal) => deal.expected_close_on ?? "9999",
        render: (deal) => (
          <span className="whitespace-nowrap text-zinc-400">
            {formatDay(deal.expected_close_on)}
          </span>
        ),
      },
      {
        id: "owner",
        label: "Owner",
        sortValue: (deal) => (deal.owner_user_id && memberNameById[deal.owner_user_id]) || "",
        render: (deal) =>
          canManage ? (
            <select
              value={deal.owner_user_id ?? ""}
              onChange={(event) => void patchDeal(deal, { owner_user_id: event.target.value || null })}
              aria-label={`Owner of ${deal.name}`}
              className="bg-transparent border border-white/10 rounded-md h-7 px-1.5 text-[11px] text-zinc-200 cursor-pointer hover:border-white/25"
            >
              <option value="" className="bg-zinc-950">
                Unassigned
              </option>
              {members.map((person) => (
                <option key={person.user_id} value={person.user_id} className="bg-zinc-950">
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          ) : (
            (deal.owner_user_id && memberNameById[deal.owner_user_id]) || "Unassigned"
          ),
      },
      {
        id: "attribution",
        label: "Attribution",
        defaultOn: false,
        sortValue: (deal) => deal.attribution_rule,
        render: (deal) => (
          <span className="text-zinc-400">{attributionSpec(deal.attribution_rule).label}</span>
        ),
      },
      {
        id: "motion",
        label: "Motion",
        defaultOn: false,
        sortValue: (deal) => deal.motion,
        render: (deal) => CRM_MOTIONS.find((entry) => entry.id === deal.motion)?.label ?? deal.motion,
      },
    ],
    [accountNameById, memberNameById, members, canManage, patchDeal]
  );

  const openDeal = (id: string) => router.push(`/admin/dashboard/deals/${id}`);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Deals</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="btn-glass h-9 px-4 text-xs disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>
          {canManage && (
            <Link href="/admin/dashboard/deals/new" className="btn-primary h-9 px-4 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New deal
            </Link>
          )}
        </div>
      </header>

      {warning && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 mb-6">
          <p className="text-xs text-zinc-300 leading-relaxed">{warning}</p>
        </div>
      )}

      {/* Totals. One quiet card holding a row of readings, matching the
          product app's stat strip rather than three floating cards. */}
      <StatRow
        className="mb-6"
        loading={loading}
        stats={[
          { label: "Deals", value: String(totals.count) },
          {
            label: "Open value",
            value: formatMoney(totals.openValue, totals.currency),
            caption: "A forecast. The ledger pays on cash that arrived.",
          },
          { label: "Open MRR", value: formatMoney(totals.openMrr, totals.currency) },
        ]}
      />

      {/* One toolbar row, then chips. Nothing is drawn until it
          constrains something, which is the whole difference between this
          and the grid of permanently-open dropdowns it replaces. */}
      <FilterBar
        specs={dealFilterSpecs}
        values={chipValues}
        onChange={setChip}
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="Search a deal or a company"
        onClear={clearFilters}
        summary={`${visible.length} of ${deals.length} shown`}
      >
        <button
          type="button"
          onClick={() =>
            downloadFile(
              stampedFilename("deals", "csv"),
              "text/csv;charset=utf-8",
              dealsToCsv(exportSet, accountNameById, memberNameById)
            )
          }
          disabled={exportSet.length === 0}
          className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full shrink-0 disabled:opacity-50"
        >
          <FileDown className="w-3.5 h-3.5" />
          CSV
        </button>
      </FilterBar>

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
        <select
          aria-label="Assign an owner to the selected"
          defaultValue=""
          disabled={!canManage}
          onChange={(e) => {
            if (!e.target.value) return;
            const value = e.target.value === "nobody" ? null : e.target.value;
            e.target.value = "";
            void assignOwners(value);
          }}
          className="admin-input h-9 py-0 w-auto cursor-pointer disabled:opacity-50"
        >
          <option value="">Assign an owner</option>
          <option value="nobody">Nobody</option>
          {members.map((person) => (
            <option key={person.user_id} value={person.user_id}>
              {person.full_name || person.email}
            </option>
          ))}
        </select>
      </BulkBar>

      {/* The list */}
      {loading ? (
        /* Layout shaped, not a spinner. The screen keeps its bones. */
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden animate-pulse">
          <div className="h-11 bg-white/[0.03]" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="border-t border-white/5 px-4 py-3.5 flex items-center gap-4">
              <div className="h-3.5 w-48 rounded bg-white/[0.04]" />
              <div className="h-3.5 w-32 rounded bg-white/[0.04]" />
              <div className="h-3.5 w-20 rounded bg-white/[0.04] ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          rows={visible}
          columns={dealColumns}
          rowId={(deal) => deal.id}
          onOpen={(deal) => openDeal(deal.id)}
          selected={selectedIds}
          onSelectedChange={setSelectedIds}
          storageKey="deals"
          empty={
            <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.06]">
              <Handshake className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <h3 className="text-xs font-medium text-zinc-400 mb-1">
                {anyFilter ? "Nothing matches these filters" : "No deals yet"}
              </h3>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {anyFilter
                  ? "Widen the filters to see the rest of the pipeline."
                  : "Deals appear here with what each is worth and when it is due to close."}
              </p>
              <div className="mt-3 flex justify-center">
                {anyFilter ? (
                  <button type="button" onClick={clearFilters} className="btn-glass h-9 px-4 text-xs">
                    Clear filters
                  </button>
                ) : (
                  canManage && (
                    <Link
                      href="/admin/dashboard/deals/new"
                      className="btn-primary h-9 px-4 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create the first deal
                    </Link>
                  )
                )}
              </div>
            </div>
          }
        />
      )}

    </div>
  );
}
