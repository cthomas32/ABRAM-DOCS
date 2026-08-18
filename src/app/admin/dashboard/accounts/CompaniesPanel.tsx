"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { can, type ConsoleRole, type GrowthStage } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/crm/constants";
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import AccountDrawer from "./AccountDrawer";
import { rows, readWarning } from "@/lib/supabase/rows";
import { StatRow } from "@/components/admin/StatTile";
import Money from "@/components/admin/Money";
import { ACCOUNT_LIFECYCLES, type AccountLifecycle } from "./lifecycles";

/**
 * The companies, as distinct from the people at them.
 *
 * A deal belongs to an account rather than to a contact, because the
 * person who takes the first meeting is regularly not the person who
 * signs. This screen is where the three columns that decide whether an
 * account pays commission are set, and where first contact is recorded,
 * which is the fact a deal registration is judged against.
 */

type SortKey = "name" | "lifecycle" | "people" | "deals" | "value" | "first";

interface MemberRow {
  user_id: string;
  full_name: string | null;
  email: string;
  role: ConsoleRole;
  growth_stage: GrowthStage | null;
  is_active: boolean;
}

const ALL = "all";

function formatDay(iso: string | null): string {
  if (!iso) return "Not yet";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "Not yet"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function CompaniesPanel() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [canManage, setCanManage] = useState(false);

  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<AccountLifecycle | typeof ALL>(ALL);
  const [showExcluded, setShowExcluded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [ascending, setAscending] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    const supabase = createClient();

    const [accountRows, contactRows, dealRows, memberRows, session] = await Promise.all([
      supabase
        .from("crm_accounts")
        .select("*")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(500),
      supabase
        .from("crm_contacts")
        .select("*")
        .eq("archived", false)
        .not("account_id", "is", null)
        .order("full_name", { ascending: true })
        .limit(1000),
      supabase.from("crm_deals").select("*").limit(500),
      supabase.from("admin_users").select("user_id, full_name, email, role, growth_stage, is_active"),
      supabase.auth.getUser(),
    ]);

    setWarning(readWarning(accountRows, "Accounts"));

    setAccounts(rows<CrmAccount>(accountRows));
    setContacts(rows<CrmContact>(contactRows));
    setDeals(rows<CrmDeal>(dealRows));

    const people = rows<MemberRow>(memberRows);
    setMembers(people);

    const me = people.find((person) => person.user_id === session.data.user?.id);
    setCanManage(
      Boolean(
        me &&
          can(
            { role: me.role, growthStage: me.growth_stage, isActive: me.is_active },
            "crm.accounts.manage"
          )
      )
    );

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    const wanted = new URLSearchParams(window.location.search).get("account");
    if (wanted && accounts.some((row) => row.id === wanted)) {
      setSelectedId(wanted);
      setDrawerOpen(true);
    }
  }, [deepLinkDone, loading, accounts]);

  const memberNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const person of members) map[person.user_id] = person.full_name || person.email;
    return map;
  }, [members]);

  /** People and deals grouped by account, worked out once per load. */
  const rollup = useMemo(() => {
    const byAccount: Record<
      string,
      { contacts: CrmContact[]; deals: CrmDeal[]; openValue: number; currency: string }
    > = {};

    for (const contact of contacts) {
      if (!contact.account_id) continue;
      const entry = (byAccount[contact.account_id] ??= {
        contacts: [],
        deals: [],
        openValue: 0,
        currency: "USD",
      });
      entry.contacts.push(contact);
    }

    for (const deal of deals) {
      const entry = (byAccount[deal.account_id] ??= {
        contacts: [],
        deals: [],
        openValue: 0,
        currency: "USD",
      });
      entry.deals.push(deal);
      entry.currency = deal.currency;
      if (deal.stage !== "won" && deal.stage !== "lost") entry.openValue += deal.amount_cents;
    }

    return byAccount;
  }, [contacts, deals]);

  const excludedFrom = (account: CrmAccount) =>
    account.is_comped || account.is_company_managed || Boolean(account.carve_out);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = accounts.filter((account) => {
      if (lifecycle !== ALL && account.lifecycle !== lifecycle) return false;
      if (showExcluded && !excludedFrom(account)) return false;
      if (needle) {
        const haystack = `${account.name} ${account.domain ?? ""} ${account.industry ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    const direction = ascending ? 1 : -1;

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "lifecycle":
          return a.lifecycle.localeCompare(b.lifecycle) * direction;
        case "people":
          return ((rollup[a.id]?.contacts.length ?? 0) - (rollup[b.id]?.contacts.length ?? 0)) * direction;
        case "deals":
          return ((rollup[a.id]?.deals.length ?? 0) - (rollup[b.id]?.deals.length ?? 0)) * direction;
        case "value":
          return ((rollup[a.id]?.openValue ?? 0) - (rollup[b.id]?.openValue ?? 0)) * direction;
        case "first": {
          // Never contacted sits at the end whichever way it is sorted.
          if (!a.first_contact_at && !b.first_contact_at) return 0;
          if (!a.first_contact_at) return 1;
          if (!b.first_contact_at) return -1;
          return a.first_contact_at.localeCompare(b.first_contact_at) * direction;
        }
        case "name":
        default:
          return a.name.localeCompare(b.name) * direction;
      }
    });
  }, [accounts, query, lifecycle, showExcluded, sortKey, ascending, rollup]);

  const totals = useMemo(() => {
    const open = visible.reduce((sum, account) => sum + (rollup[account.id]?.openValue ?? 0), 0);
    return {
      count: visible.length,
      untouched: visible.filter((account) => !account.first_contact_at).length,
      excluded: visible.filter(excludedFrom).length,
      openValue: open,
      currency: deals[0]?.currency ?? "USD",
    };
  }, [visible, rollup, deals]);

  const selected = selectedId ? accounts.find((account) => account.id === selectedId) ?? null : null;
  const filtered = Boolean(query.trim()) || lifecycle !== ALL || showExcluded;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAscending((value) => !value);
    else {
      setSortKey(key);
      setAscending(true);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setLifecycle(ALL);
    setShowExcluded(false);
  };

  const openNew = () => {
    setSelectedId(null);
    setDrawerOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Accounts</h1>
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
            <button type="button" onClick={openNew} className="btn-primary h-9 px-4 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New account
            </button>
          )}
        </div>
      </header>

      {warning && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 mb-6">
          <p className="text-xs text-zinc-300 leading-relaxed">{warning}</p>
        </div>
      )}

      <StatRow
        className="mb-6"
        loading={loading}
        stats={[
          { label: "Accounts", value: String(totals.count) },
          {
            label: "Open value",
            value: formatMoney(totals.openValue, totals.currency),
          },
          {
            label: "Not contacted",
            value: String(totals.untouched),
            caption: "Still open to a deal registration.",
          },
          {
            label: "Excluded",
            value: String(totals.excluded),
            caption: "Comped, company managed or carved out.",
          },
        ]}
      />

      {/* One toolbar row, one control height. */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, domain or industry"
            aria-label="Search accounts"
            className="admin-input h-9 py-0 pl-8 w-full sm:w-64"
          />
        </div>

        <select
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value as AccountLifecycle | typeof ALL)}
          aria-label="Filter by lifecycle"
          className="admin-input h-9 py-0 w-auto cursor-pointer"
        >
          <option value={ALL}>Every lifecycle</option>
          {ACCOUNT_LIFECYCLES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowExcluded((value) => !value)}
          aria-pressed={showExcluded}
          className={`h-9 px-4 rounded-full text-xs font-medium border transition-colors ${
            showExcluded
              ? "bg-white/[0.08] border-white/15 text-white"
              : "bg-white/[0.02] border-white/8 text-zinc-400 hover:text-white"
          }`}
        >
          Pays no commission
        </button>

        {filtered && (
          <button type="button" onClick={clearFilters} className="btn-glass h-9 px-4 text-xs">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden animate-pulse">
          <div className="h-11 bg-white/[0.03]" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="border-t border-white/5 px-4 py-3.5 flex items-center gap-4">
              <div className="h-3.5 w-44 rounded bg-white/[0.04]" />
              <div className="h-3.5 w-24 rounded bg-white/[0.04]" />
              <div className="h-3.5 w-20 rounded bg-white/[0.04] ml-auto" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.06]">
          <Building2 className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <h3 className="text-xs font-medium text-zinc-400 mb-1">
            {filtered ? "Nothing matches these filters" : "No accounts yet"}
          </h3>
          <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
            {filtered
              ? "Widen the filters to see the rest of the list."
              : "Companies appear here, with the people and deals that roll up to each."}
          </p>
          <div className="mt-3 flex justify-center">
            {filtered ? (
              <button type="button" onClick={clearFilters} className="btn-glass h-9 px-4 text-xs">
                Clear filters
              </button>
            ) : (
              canManage && (
                <button type="button" onClick={openNew} className="btn-primary h-9 px-4 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Add the first account
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
                  <SortHeader label="Account" id="name" active={sortKey} ascending={ascending} onSort={toggleSort} />
                  <SortHeader label="Lifecycle" id="lifecycle" active={sortKey} ascending={ascending} onSort={toggleSort} />
                  <SortHeader label="People" id="people" active={sortKey} ascending={ascending} onSort={toggleSort} align="right" />
                  <SortHeader label="Deals" id="deals" active={sortKey} ascending={ascending} onSort={toggleSort} align="right" />
                  <SortHeader label="Open value" id="value" active={sortKey} ascending={ascending} onSort={toggleSort} align="right" />
                  <SortHeader label="First contact" id="first" active={sortKey} ascending={ascending} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {visible.map((account) => {
                  const entry = rollup[account.id];
                  const excluded = excludedFrom(account);
                  return (
                    <tr
                      key={account.id}
                      onClick={() => {
                        setSelectedId(account.id);
                        setDrawerOpen(true);
                      }}
                      className="border-t border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="block text-xs font-medium text-white break-words">
                          {account.name}
                        </span>
                        <span className="block text-[11px] text-zinc-400 mt-0.5 break-words">
                          {account.domain ?? "No web address"}
                          {excluded && " · Pays no commission"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-white/[0.04] border-white/8 text-zinc-400 capitalize whitespace-nowrap">
                          {account.lifecycle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                        {entry?.contacts.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                        {entry?.deals.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-white text-right tabular-nums whitespace-nowrap">
                        {entry?.openValue ? (
                          <Money cents={entry.openValue} currency={entry.currency} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {formatDay(account.first_contact_at)}
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
        <AccountDrawer
          account={selected}
          contacts={selected ? rollup[selected.id]?.contacts ?? [] : []}
          deals={selected ? rollup[selected.id]?.deals ?? [] : []}
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
        {isActive && (ascending ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}
