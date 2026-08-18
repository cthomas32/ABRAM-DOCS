"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Handshake, Loader2, Plus, RefreshCw } from "lucide-react";
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
import DealDrawer, { type AccountOption, type ContactOption } from "./DealDrawer";
import { rows, readWarning } from "@/lib/supabase/rows";
import { StatRow } from "@/components/admin/StatTile";
import Money from "@/components/admin/Money";
import ViewSwitch, { DEAL_VIEWS } from "@/components/admin/ViewSwitch";

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

type SortKey = "name" | "account" | "amount" | "mrr" | "close" | "stage";

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

export default function DealsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [canManage, setCanManage] = useState(false);

  const [stage, setStage] = useState<DealStage | typeof ALL>(ALL);
  const [owner, setOwner] = useState<string>(ALL);
  const [motion, setMotion] = useState<CrmMotion | typeof ALL>(ALL);
  const [closeMonth, setCloseMonth] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("close");
  const [ascending, setAscending] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    const supabase = createClient();

    const [dealRows, accountRows, contactRows, memberRows, session] = await Promise.all([
      supabase.from("crm_deals").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase
        .from("crm_accounts")
        .select("id, name, domain")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(500),
      supabase
        .from("crm_contacts")
        .select("id, full_name, account_id")
        .eq("archived", false)
        .order("full_name", { ascending: true })
        .limit(1000),
      supabase
        .from("admin_users")
        .select("user_id, full_name, email, role, growth_stage, is_active"),
      supabase.auth.getUser(),
    ]);

    setWarning(readWarning(dealRows, "Deals"));

    setDeals(rows<CrmDeal>(dealRows));
    setAccounts(rows<AccountOption>(accountRows));
    setContacts(rows<ContactOption>(contactRows));

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

  const visible = useMemo(() => {
    const filtered = deals.filter((deal) => {
      if (stage !== ALL && deal.stage !== stage) return false;
      if (owner !== ALL && deal.owner_user_id !== owner) return false;
      if (motion !== ALL && deal.motion !== motion) return false;
      if (closeMonth !== ALL && monthKey(deal.expected_close_on) !== closeMonth) return false;
      return true;
    });

    const direction = ascending ? 1 : -1;
    const stageOrder = (id: string) => DEAL_STAGES.findIndex((s) => s.id === id);

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * direction;
        case "account":
          return (accountNameById[a.account_id] ?? "").localeCompare(
            accountNameById[b.account_id] ?? ""
          ) * direction;
        case "amount":
          return (a.amount_cents - b.amount_cents) * direction;
        case "mrr":
          return (a.mrr_cents - b.mrr_cents) * direction;
        case "stage":
          return (stageOrder(a.stage) - stageOrder(b.stage)) * direction;
        case "close":
        default: {
          // Deals with no date sit at the end whichever way it is sorted.
          // "Not scheduled" is not early, it is missing.
          if (!a.expected_close_on && !b.expected_close_on) return 0;
          if (!a.expected_close_on) return 1;
          if (!b.expected_close_on) return -1;
          return a.expected_close_on.localeCompare(b.expected_close_on) * direction;
        }
      }
    });
  }, [deals, stage, owner, motion, closeMonth, sortKey, ascending, accountNameById]);

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
      setSelectedId(wanted);
      setDrawerOpen(true);
    }
  }, [deepLinkDone, loading, deals]);

  const selected = selectedId ? deals.find((deal) => deal.id === selectedId) ?? null : null;
  const filtered = stage !== ALL || owner !== ALL || motion !== ALL || closeMonth !== ALL;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAscending((value) => !value);
    else {
      setSortKey(key);
      setAscending(true);
    }
  };

  const openNew = () => {
    setSelectedId(null);
    setDrawerOpen(true);
  };

  const openDeal = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Deals</h1>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitch options={DEAL_VIEWS} />
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
            <button type="button" onClick={openNew} className="btn-primary h-9 px-4 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New deal
            </button>
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

      {/* Filters. One row, one control height. */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as DealStage | typeof ALL)}
          aria-label="Filter by stage"
          className="admin-input h-9 py-0 w-auto cursor-pointer"
        >
          <option value={ALL}>Every stage</option>
          {DEAL_STAGES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          aria-label="Filter by owner"
          className="admin-input h-9 py-0 w-auto cursor-pointer"
        >
          <option value={ALL}>Every owner</option>
          {ownerOptions.map((person) => (
            <option key={person.user_id} value={person.user_id}>
              {person.full_name || person.email}
            </option>
          ))}
        </select>

        <select
          value={motion}
          onChange={(e) => setMotion(e.target.value as CrmMotion | typeof ALL)}
          aria-label="Filter by motion"
          className="admin-input h-9 py-0 w-auto cursor-pointer"
        >
          <option value={ALL}>Both motions</option>
          {CRM_MOTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={closeMonth}
          onChange={(e) => setCloseMonth(e.target.value)}
          aria-label="Filter by close month"
          className="admin-input h-9 py-0 w-auto cursor-pointer"
        >
          <option value={ALL}>Any close month</option>
          {closeMonths.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>

        {filtered && (
          <button
            type="button"
            onClick={() => {
              setStage(ALL);
              setOwner(ALL);
              setMotion(ALL);
              setCloseMonth(ALL);
            }}
            className="btn-glass h-9 px-4 text-xs"
          >
            Clear filters
          </button>
        )}
      </div>

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
      ) : visible.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.06]">
          <Handshake className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <h3 className="text-xs font-medium text-zinc-400 mb-1">
            {filtered ? "Nothing matches these filters" : "No deals yet"}
          </h3>
          <p className="text-[11px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
            {filtered
              ? "Widen the filters to see the rest of the pipeline."
              : "Deals appear here with what each is worth and when it is due to close."}
          </p>
          <div className="mt-3 flex justify-center">
            {filtered ? (
              <button
                type="button"
                onClick={() => {
                  setStage(ALL);
                  setOwner(ALL);
                  setMotion(ALL);
                  setCloseMonth(ALL);
                }}
                className="btn-glass h-9 px-4 text-xs"
              >
                Clear filters
              </button>
            ) : (
              canManage && (
                <button type="button" onClick={openNew} className="btn-primary h-9 px-4 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Create the first deal
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-white/[0.03]">
                  <SortHeader
                    label="Deal"
                    id="name"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                  />
                  <SortHeader
                    label="Account"
                    id="account"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                  />
                  <SortHeader
                    label="Stage"
                    id="stage"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                  />
                  <SortHeader
                    label="Amount"
                    id="amount"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortHeader
                    label="MRR"
                    id="mrr"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortHeader
                    label="Close"
                    id="close"
                    active={sortKey}
                    ascending={ascending}
                    onSort={toggleSort}
                  />
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((deal) => {
                  const spec = DEAL_STAGES.find((s) => s.id === deal.stage) ?? DEAL_STAGES[0];
                  const attribution = attributionSpec(deal.attribution_rule);
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => openDeal(deal.id)}
                      className="border-t border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="block text-xs font-medium text-white break-words">
                          {deal.name}
                        </span>
                        <span className="block text-[11px] text-zinc-600 mt-0.5">
                          {attribution.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 break-words">
                        {accountNameById[deal.account_id] ?? "Account not readable"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${spec.badge}`}
                        >
                          {spec.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-300 text-right tabular-nums whitespace-nowrap">
                        {deal.amount_cents ? <Money cents={deal.amount_cents} currency={deal.currency} /> : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 text-right tabular-nums whitespace-nowrap">
                        {deal.mrr_cents ? <Money cents={deal.mrr_cents} currency={deal.currency} /> : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {formatDay(deal.expected_close_on)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 break-words">
                        {(deal.owner_user_id && memberNameById[deal.owner_user_id]) || "Unassigned"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawerOpen && (
        <DealDrawer
          deal={selected}
          accounts={accounts}
          contacts={contacts}
          memberNameById={memberNameById}
          canManage={canManage}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => void load(true)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bits                                                               */
/* ------------------------------------------------------------------ */

function SortHeader({
  label,
  id,
  active,
  ascending,
  onSort,
  align = "left",
}: {
  label: string;
  id: SortKey;
  active: SortKey;
  ascending: boolean;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = active === id;
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(id)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1 text-xs uppercase font-bold tracking-widest transition-colors ${
          isActive ? "text-white" : "text-gray-400 hover:text-white"
        }`}
      >
        {label}
        {isActive &&
          (ascending ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}
