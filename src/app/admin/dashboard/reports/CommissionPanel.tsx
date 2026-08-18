import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import Bars from "@/components/admin/Bars";
import { formatMoney } from "@/lib/crm/constants";
import type { CommissionRow } from "@/lib/crm/reports";

/**
 * What everybody is owed, and what has been paid.
 *
 * Stricter than the rest of the reporting, and deliberately so. A Head of
 * Growth may read the whole pipeline because she works it; what every
 * other partner earns is not hers to read, so `crm_report_commission`
 * refuses anybody who is not an owner or an admin rather than deferring
 * to the softer rollup guard.
 *
 * A partner's own half of the same ledger is the earnings tab, which
 * reads `commission_statement` under row level security.
 */

export default async function CommissionPanel() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "commission.manage")) redirect("/admin/dashboard");

  const supabase = await createClient();
  const result = await supabase.rpc("crm_report_commission");
  const commission = rows<CommissionRow>(result);

  const owed = commission.reduce((sum, row) => sum + row.outstanding_cents, 0);
  const paid = commission.reduce((sum, row) => sum + row.paid_cents, 0);
  const currency = commission[0]?.currency ?? "USD";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Commission owed and paid
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Across everybody, from the same ledger each partner reads their own half of. Commission is
          calculated on cash that has arrived, so this stays at zero until collected payments are
          mirrored into this database.
        </p>
      </header>

      {commission.length === 0 ? (
        <EmptyPanel title="No commission has been accrued.">
          Nothing writes a collection row yet, so every figure here would be zero. The zero is
          honest rather than broken.
        </EmptyPanel>
      ) : (
        <>
          <StatRow
            className="mb-8"
            stats={[
              { label: "Outstanding", value: formatMoney(owed, currency), hint: "Due within 30 days of each month's close." },
              { label: "Paid", value: formatMoney(paid, currency) },
              { label: "People", value: String(new Set(commission.map((row) => row.user_id)).size) },
            ]}
          />

          <Overline as="h2" className="mb-4">
            By person
          </Overline>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <Bars
              data={commission.map((row) => ({
                id: `${row.user_id}-${row.currency}`,
                label: row.full_name || "No name set",
                value: row.earned_cents,
                display: formatMoney(row.earned_cents, row.currency),
                hint: `${formatMoney(row.outstanding_cents, row.currency)} outstanding`,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
