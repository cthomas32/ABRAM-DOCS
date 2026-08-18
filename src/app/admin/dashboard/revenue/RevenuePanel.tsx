import { redirect } from "next/navigation";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { Banknote } from "lucide-react";

/**
 * Revenue and commission, before it has anything to show.
 *
 * The nav has linked here since the roles branch landed and the directory
 * did not exist, so an owner clicking it got a 404. Two ways to fix that:
 * remove the link, or say what the page is waiting on. Removing it would
 * hide the one gap that matters most in the commission chain, and the gap
 * is the point. Every other piece of the ledger is built and tested and
 * cannot produce a single figure until something writes
 * `revenue_collections`, which means mirroring collected payments out of
 * the product's Stripe into this database.
 *
 * So this page exists, it is owner-only, and it says plainly that the
 * mirror is not wired yet. When it is, this becomes the collections list,
 * the unlinked-collections queue and the payout runs described as P1-2 in
 * docs/plans/crm-hubspot-parity.md.
 */


export default async function RevenuePanel() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "commission.manage")) redirect("/admin/dashboard");

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

      <Panel
        tone="attention"
        title="The collections mirror is not wired up yet"
        icon={<Banknote className="w-4 h-4 text-amber-400" />}
        className="mb-8"
      >
        Commission is calculated on cash that has actually arrived, and the record of what arrived
        lives in the product&rsquo;s Stripe account rather than in this database. Nothing writes a
        collection row here today, so every statement on the console reads zero. That figure is
        honest rather than broken.
      </Panel>

      <section>
        <Overline className="mb-4">What lands on this page</Overline>
        <EmptyPanel title="Collections, payouts and the recompute button.">
          Once payments are mirrored across, this becomes the list of collections, the queue of
          collections not yet linked to a deal, and the monthly payout runs. Until then the only
          number anybody should trust is the one in Stripe.
        </EmptyPanel>
      </section>
    </div>
  );
}
