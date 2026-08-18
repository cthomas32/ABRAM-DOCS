import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { DealStage } from "@/lib/crm/constants";
import DealBoard, { type BoardPerson, type DealBoardRow } from "../DealBoard";

/**
 * The deal board.
 *
 * A second view of the deals list rather than a second list. Everything
 * it writes goes through boardActions.ts, which repeats the permission
 * check, and row level security decides independently what comes back
 * from the read below.
 *
 * The contact board on the CRM screen stays where it is. Two boards over
 * two objects, one navigation section, because a contact travelling
 * through interest and a deal travelling through money are different
 * journeys and the commission agreement is written about the second one.
 */

export const dynamic = "force-dynamic";

/** The account arrives as a to-one relation the client types as an array. */
function accountName(value: unknown): string | null {
  const record = Array.isArray(value) ? value[0] : value;
  if (record && typeof record === "object" && "name" in record) {
    const name = (record as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }
  return null;
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

  const deals: DealBoardRow[] = (dealsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    stage: row.stage as DealStage,
    amount_cents: Number(row.amount_cents ?? 0),
    currency: (row.currency as string) ?? "USD",
    expected_close_on: (row.expected_close_on as string | null) ?? null,
    owner_user_id: (row.owner_user_id as string | null) ?? null,
    account_name: accountName(row.account),
  }));

  const people = ((peopleRes.data ?? []) as BoardPerson[]) ?? [];

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0 overflow-y-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Where every deal stands
        </h1>
        <Link href="/admin/dashboard/deals" className="btn-glass h-9 px-4 text-xs font-medium">
          Deal list
        </Link>
      </header>

      <DealBoard
        deals={deals}
        people={people}
        loadError={dealsRes.error ? dealsRes.error.message : null}
      />
    </div>
  );
}
