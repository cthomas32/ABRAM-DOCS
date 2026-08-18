import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { DealStage } from "@/lib/crm/constants";
import { StatRow } from "@/components/admin/StatTile";
import ViewSwitch, { DEAL_VIEWS } from "@/components/admin/ViewSwitch";
import { rows, firstRow } from "@/lib/supabase/rows";
import DealBoard, { type BoardPerson, type DealBoardRow } from "../DealBoard";

/**
 * The deal board.
 *
 * A second view of the deals list rather than a second list. Everything it
 * writes goes through boardActions.ts, which repeats the permission check,
 * and row level security decides independently what comes back from the
 * read below.
 */

export const dynamic = "force-dynamic";

/** The account arrives as a to-one relation the client types as an array. */
function accountName(value: unknown): string | null {
  const record = firstRow<{ name?: unknown }>(value);
  return typeof record?.name === "string" ? record.name : null;
}

function money(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

/** The last day of the month the reader is in, as `YYYY-MM-DD`. */
function endOfThisMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
}

export default async function DealBoardPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.deals.manage")) redirect("/admin/dashboard");

  const supabase = await createClient();

  const [dealsRes, peopleRes] = await Promise.all([
    supabase
      .from("crm_deals")
      .select(
        "id, name, stage, amount_cents, currency, expected_close_on, owner_user_id, account:crm_accounts(name)"
      )
      .order("expected_close_on", { ascending: true, nullsFirst: false })
      .limit(500),
    supabase.from("admin_users").select("user_id, full_name, email"),
  ]);

  const deals: DealBoardRow[] = rows<Record<string, unknown>>(dealsRes).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    stage: row.stage as DealStage,
    amount_cents: Number(row.amount_cents ?? 0),
    currency: (row.currency as string) ?? "USD",
    expected_close_on: (row.expected_close_on as string | null) ?? null,
    owner_user_id: (row.owner_user_id as string | null) ?? null,
    account_name: accountName(row.account),
  }));

  const people = rows<BoardPerson>(peopleRes);
  const currency = deals[0]?.currency ?? "USD";

  const open = deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const openValue = open.reduce((sum, deal) => sum + deal.amount_cents, 0);
  const won = deals.filter((deal) => deal.stage === "won");
  const wonValue = won.reduce((sum, deal) => sum + deal.amount_cents, 0);

  const monthEnd = endOfThisMonth();
  const closingThisMonth = open.filter(
    (deal) => deal.expected_close_on && deal.expected_close_on <= monthEnd
  );
  const slipped = open.filter(
    (deal) =>
      deal.expected_close_on && deal.expected_close_on < new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0 overflow-y-auto">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Deals</h1>
        <div className="flex items-center gap-2">
          <ViewSwitch options={DEAL_VIEWS} />
          <Link href="/admin/dashboard/tasks" className="btn-glass h-9 px-4 text-xs font-medium">
            Follow ups
          </Link>
        </div>
      </header>

      <StatRow
        className="mb-5"
        stats={[
          {
            label: "Open pipeline",
            value: money(openValue, currency),
            caption: `${open.length} ${open.length === 1 ? "deal" : "deals"} still moving`,
          },
          {
            label: "Closing this month",
            value: money(
              closingThisMonth.reduce((sum, deal) => sum + deal.amount_cents, 0),
              currency
            ),
            caption: `${closingThisMonth.length} expected to land`,
          },
          {
            label: "Past their close date",
            value: String(slipped.length),
            caption: slipped.length ? "Move the date or move the deal" : "Nothing has slipped",
            attention: slipped.length > 0,
          },
          {
            label: "Won",
            value: money(wonValue, currency),
            caption: `${won.length} closed`,
          },
        ]}
      />

      <DealBoard
        deals={deals}
        people={people}
        loadError={dealsRes.error ? dealsRes.error.message : null}
      />
    </div>
  );
}
