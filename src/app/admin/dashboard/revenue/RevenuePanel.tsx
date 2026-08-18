import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { Banknote, UserSearch } from "lucide-react";
import SyncPanel, { type SyncEventView } from "./SyncPanel";

/**
 * Revenue and commission.
 *
 * The mirror exists now. abram-network queues every collected payment,
 * refund and chargeback and posts it here signed; `revenue_sync_events`
 * is the record of what arrived and what it did. This page is the first
 * screen that reads it, and it deliberately shows the sync before it
 * shows any money: a statement is only worth reading if the payments
 * behind it actually came across, and the honest way to say so is to put
 * the pipe's health above the figures rather than beside them.
 *
 * Still to land here, in the order P1-2 of docs/plans/crm-hubspot-parity.md
 * describes: the collections list, the unlinked-collections queue and the
 * monthly payout runs.
 */

interface EventRow {
  event_id: string;
  event_type: string;
  sync_type: string;
  status: string;
  note: string | null;
  received_at: string;
  replay_count: number;
  payload: {
    amount_cents?: number;
    currency?: string;
    org_name?: string | null;
    customer_email?: string | null;
  } | null;
}

export default async function RevenuePanel() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "commission.manage")) redirect("/admin/dashboard");

  const supabase = await createClient();

  const [{ data: eventRows }, { data: reviewAccounts }, { count: pendingReview }] = await Promise.all([
    supabase
      .from("revenue_sync_events")
      .select("event_id, event_type, sync_type, status, note, received_at, replay_count, payload")
      .order("received_at", { ascending: false })
      .limit(10),
    supabase
      .from("crm_accounts")
      .select("id, name, domain, created_at")
      .eq("needs_review", true)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("crm_deals")
      .select("id", { count: "exact", head: true })
      .eq("needs_review", true),
  ]);

  const events: SyncEventView[] = ((eventRows ?? []) as unknown as EventRow[]).map((row) => ({
    eventId: row.event_id,
    eventType: row.event_type,
    syncType: row.sync_type,
    status: row.status,
    note: row.note,
    receivedAt: row.received_at,
    amountCents: typeof row.payload?.amount_cents === "number" ? row.payload.amount_cents : null,
    currency: row.payload?.currency ?? "USD",
    who: row.payload?.org_name ?? row.payload?.customer_email ?? null,
    replayCount: row.replay_count ?? 0,
  }));

  const accounts = (reviewAccounts ?? []) as { id: string; name: string; domain: string | null }[];
  const unresolvedDeals = pendingReview ?? 0;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Revenue and commission
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Collected payments, what each one paid out, and the payout runs that settle it.
        </p>
      </header>

      {(accounts.length > 0 || unresolvedDeals > 0) && (
        <Panel
          tone="attention"
          title="Payments arrived from customers this CRM did not recognise"
          icon={<UserSearch className="w-4 h-4 text-amber-400" />}
          className="mb-8"
        >
          The money is recorded either way — a collection nobody can find is worse than an untidy
          one. Until somebody says whose these accounts are, the deals behind them have no sourcer
          and pay nobody.
          {unresolvedDeals > 0 && (
            <span className="block mt-1">
              {unresolvedDeals} deal{unresolvedDeals === 1 ? "" : "s"} created by the sync.
            </span>
          )}
        </Panel>
      )}

      <section className="mb-10">
        <Overline className="mb-4">Sync</Overline>
        <SyncPanel events={events} />
      </section>

      {accounts.length > 0 && (
        <section className="mb-10">
          <Overline className="mb-4">Accounts to identify</Overline>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3 flex items-baseline gap-2"
              >
                <span className="text-xs font-semibold text-white truncate">{account.name}</span>
                {account.domain && (
                  <span className="text-[11px] text-zinc-500 truncate">{account.domain}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <Overline className="mb-4">Still to land here</Overline>
        <EmptyPanel title="Collections, payouts and the recompute button.">
          The list of collections, the queue of collections not yet linked to a deal, and the monthly
          payout runs. The payments themselves are arriving now; what is missing is the screens that
          read them.
        </EmptyPanel>
      </section>

      <p className="text-[11px] text-zinc-600 mt-10 leading-relaxed flex items-start gap-2">
        <Banknote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Nothing on this page is authoritative about money. abram-network is, and a figure here that
          disagrees with Stripe is wrong by definition.
        </span>
      </p>
    </div>
  );
