import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { formatMoney, formatRate } from "@/lib/crm/constants";
import type {
  AttributedMrrRow,
  CommissionEntry,
  CommissionStatementRow,
  GrowthEquityTranche,
  GrowthPartnerTerms,
} from "@/lib/growth/types";
import { AlertCircle, Banknote } from "lucide-react";

/**
 * What a partner has earned, and the arithmetic behind it.
 *
 * This screen exists to end a category of conversation rather than to
 * look impressive. The question it answers is "why is this number what it
 * is", so every row shows the collection it came from, the rate applied
 * and whether that rate was the closing one or the sourcing one. A
 * statement that shows only a total invites exactly the argument it was
 * built to prevent.
 *
 * It shows nothing that is not already derivable. A partner can compute
 * what their own accounts paid from their commission and their known
 * rate, so hiding the basis would be theatre. What stays invisible is
 * everybody else's accounts and every payment instrument, and that is
 * enforced by row level security rather than by this file.
 */

export const dynamic = "force-dynamic";

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
      {children}
    </span>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 block">
        {label}
      </span>
      <span className="text-2xl font-bold tracking-tight text-white block mt-1.5 break-words">
        {value}
      </span>
      {hint && <span className="text-[11px] text-zinc-500 block mt-1 leading-relaxed">{hint}</span>}
    </div>
  );
}

function monthLabel(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function EarningsPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "commission.read.own")) redirect("/admin/dashboard");

  const supabase = await createClient();

  // Row level security scopes all of these to this person. An owner
  // reading their own page sees their own rows for the same reason.
  const [statementRes, entriesRes, termsRes, mrrRes, tranchesRes] = await Promise.all([
    supabase
      .from("commission_statement")
      .select("*")
      .eq("user_id", user.userId)
      .order("collection_month", { ascending: false }),
    supabase
      .from("commission_entries")
      .select("*")
      .eq("user_id", user.userId)
      .neq("status", "void")
      .order("collection_month", { ascending: false })
      .limit(200),
    supabase
      .from("growth_partner_terms")
      .select("*")
      .eq("user_id", user.userId)
      .is("effective_to", null)
      .maybeSingle(),
    supabase
      .from("growth_attributed_mrr")
      .select("*")
      .eq("user_id", user.userId)
      .maybeSingle(),
    supabase
      .from("growth_equity_tranches")
      .select("*")
      .eq("user_id", user.userId)
      .order("trigger_mrr_cents", { ascending: true, nullsFirst: true }),
  ]);

  const statement = (statementRes.data ?? []) as CommissionStatementRow[];
  const entries = (entriesRes.data ?? []) as CommissionEntry[];
  const terms = (termsRes.data ?? null) as GrowthPartnerTerms | null;
  const mrr = (mrrRes.data ?? null) as AttributedMrrRow | null;
  const tranches = (tranchesRes.data ?? []) as GrowthEquityTranche[];

  const currency = statement[0]?.currency ?? "USD";
  const lifetime = statement.reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
  const outstanding = statement.reduce((sum, row) => sum + (row.outstanding_cents ?? 0), 0);
  const paid = statement.reduce((sum, row) => sum + (row.paid_cents ?? 0), 0);

  // A deal id appearing in the entries is one that actually paid.
  const payingDeals = new Set(entries.map((e) => e.deal_id).filter(Boolean)).size;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <Overline>Earnings</Overline>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          What you have earned
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Commission is calculated on cash actually collected, not on bookings or pipeline. A
          payment appears here the month it lands, at the rate that applied in that month.
        </p>
      </header>

      {/* Current terms */}
      {terms ? (
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Lifetime"
              value={formatMoney(lifetime, currency)}
              hint="Clawbacks already deducted."
            />
            <StatTile
              label="Paid"
              value={formatMoney(paid, currency)}
            />
            <StatTile
              label="Outstanding"
              value={formatMoney(outstanding, currency)}
              hint="Due within 30 days of each month's close."
            />
            <StatTile
              label="Paying deals"
              value={String(payingDeals)}
              hint={`${formatRate(terms.close_rate)} closed · ${formatRate(terms.source_rate)} sourced`}
            />
          </div>
        </section>
      ) : (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-200">No commission terms are set up yet</p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Nothing can be calculated until an owner records your rates and start date. Until then
              this page will stay empty even if deals are closing.
            </p>
          </div>
        </div>
      )}

      {/* Attributed MRR and the tranches it unlocks */}
      {mrr && (
        <section className="mb-10">
          <Overline>Attributed MRR</Overline>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold tracking-tight text-white">
                {formatMoney(mrr.attributed_mrr_cents, currency)}
              </span>
              <span className="text-xs text-zinc-500">
                across {mrr.won_deals} won {mrr.won_deals === 1 ? "deal" : "deals"}
                {mrr.open_deals > 0 && `, ${mrr.open_deals} still open`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Recurring revenue on won, attributed deals you sourced. Comped, company-managed and
              carved-out accounts are excluded.
            </p>

            {tranches.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/5 space-y-2.5">
                {tranches.map((tranche) => {
                  const target = tranche.trigger_mrr_cents ?? 0;
                  const reached = Boolean(tranche.triggered_at) ||
                    (target > 0 && mrr.attributed_mrr_cents >= target);
                  const pct = target > 0
                    ? Math.min(100, Math.round((mrr.attributed_mrr_cents / target) * 100))
                    : 100;

                  return (
                    <div key={tranche.id}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-xs text-zinc-300 truncate">
                          {tranche.label}
                          <span className="text-zinc-500 ml-2">{tranche.size_pct}%</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold shrink-0 ${
                            reached ? "text-emerald-400" : "text-zinc-500"
                          }`}
                        >
                          {reached
                            ? "Reached"
                            : target > 0
                              ? `at ${formatMoney(target, currency)}`
                              : "—"}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${reached ? "bg-emerald-400" : "bg-zinc-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Month by month */}
      <section className="mb-10">
        <Overline>By month</Overline>
        {statement.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <Banknote className="w-6 h-6 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Nothing collected yet.</p>
            <p className="text-[11px] text-zinc-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              A month appears here once a payment lands against a deal attributed to you. Closing a
              deal does not on its own produce a figure — the cash has to arrive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">Month</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Collected</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Earned</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Paid</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {statement.map((row) => (
                  <tr key={row.collection_month} className="border-t border-white/5">
                    <td className="px-4 py-3 text-xs text-zinc-300 whitespace-nowrap">
                      {monthLabel(row.collection_month)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 text-right tabular-nums">
                      {formatMoney(row.basis_cents, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-white text-right tabular-nums">
                      {formatMoney(row.total_cents, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                      {formatMoney(row.paid_cents, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                      {formatMoney(row.outstanding_cents, row.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="md:hidden text-[10px] text-zinc-600 mt-2">Swipe to view →</p>
      </section>

      {/* Every line, with its arithmetic */}
      {entries.length > 0 && (
        <section>
          <Overline>Every line</Overline>
          <p className="text-[11px] text-zinc-500 mb-4 max-w-2xl leading-relaxed">
            One row per payment. &ldquo;Closed&rdquo; is the higher rate and applies when you both
            sourced and closed the account; &ldquo;sourced&rdquo; applies when you originated it and
            somebody else closed it.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">Month</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">Credit</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Collected</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Rate</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 text-right">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                      {monthLabel(entry.collection_month)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          entry.credit_type === "closed"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-sky-500/10 text-sky-300 border-sky-500/20"
                        }`}
                      >
                        {entry.credit_type === "closed" ? "Closed" : "Sourced"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 text-right tabular-nums">
                      {formatMoney(entry.basis_cents, entry.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 text-right tabular-nums">
                      {formatRate(entry.rate_applied)}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs font-semibold text-right tabular-nums ${
                        entry.amount_cents < 0 ? "text-rose-400" : "text-white"
                      }`}
                    >
                      {formatMoney(entry.amount_cents, entry.currency)}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-zinc-500 capitalize">
                      {entry.status.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="md:hidden text-[10px] text-zinc-600 mt-2">Swipe to view →</p>
        </section>
      )}

      <footer className="mt-12 pt-6 border-t border-white/5">
        <p className="text-[11px] text-zinc-600 leading-relaxed max-w-2xl">
          Figures are derived from collected payments and are not a statement of account. A payment
          reversed within the clawback window removes the commission accrued on it, which will show
          here as a negative line rather than as a changed figure.
        </p>
      </footer>
    </div>
  );
}
