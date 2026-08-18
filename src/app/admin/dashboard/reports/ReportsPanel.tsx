import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import Bars, { WeekColumns } from "@/components/admin/Bars";
import { formatMoney } from "@/lib/crm/constants";
import {
  ACTIVITY_GROUPS,
  buildFunnel,
  foldActivity,
  type ActivityRow,
  type LifecycleRow,
  type RepRow,
} from "@/lib/crm/reports";

/**
 * What everybody did, and what it produced.
 *
 * Every other screen on this console is scoped: a partner sees their own
 * accounts, their own statement, their own queue. This one is the
 * exception, and the exception is the whole reason the numbers come out
 * of SECURITY DEFINER functions rather than out of queries. Row level
 * security is doing its job when it refuses a cross-company read; a
 * rollup has to be granted deliberately, to a named set of people.
 *
 * So the guard is in three places and they agree: the route table, this
 * component, and public.can_read_reports() in the database.
 *
 * The pipeline and the forecast are not here. They live on the deals
 * object, beside the deals they are about, because a forecast read away
 * from the board it came off is a number nobody can check.
 */

const ACTIVITY_WEEKS = 8;

export default async function ReportsPanel() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "reports.read")) redirect("/admin/dashboard");

  const supabase = await createClient();

  const [repRes, activityRes, lifecycleRes] = await Promise.all([
    supabase.rpc("crm_report_by_rep"),
    supabase.rpc("crm_report_activity", { p_weeks: ACTIVITY_WEEKS }),
    supabase.rpc("crm_report_lifecycle"),
  ]);

  const reps = rows<RepRow>(repRes);
  const activity = foldActivity(rows<ActivityRow>(activityRes));
  const funnel = buildFunnel(rows<LifecycleRow>(lifecycleRes));

  // One sentence rather than three: "reporting is not available to your
  // role" three times reads as three problems.
  const refused = [repRes, activityRes, lifecycleRes].some((result) => result.error);

  const sourcedWon = reps.reduce((sum, rep) => sum + rep.sourced_won_cents, 0);
  const loggedThisWindow = activity.reduce((sum, rep) => sum + rep.total, 0);
  const customers = funnel.steps.find((step) => step.id === "customer")?.people ?? 0;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          What everybody did
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Every figure below is a count or a sum over rows somebody entered by hand. A call nobody
          logged is a call that did not happen here.
        </p>
      </header>

      {refused && (
        <Panel className="mb-8" title="Some of the figures could not be read">
          Reporting reads across everybody, which is a permission of its own. Ask an owner to check
          your access, or sign in again.
        </Panel>
      )}

      <StatRow
        className="mb-10"
        stats={[
          { label: "Won, sourced", value: formatMoney(sourcedWon), hint: "Across everybody" },
          {
            label: `Logged, ${ACTIVITY_WEEKS} weeks`,
            value: loggedThisWindow.toLocaleString(),
            hint: "Calls, meetings, emails and notes",
          },
          { label: "Customers", value: customers.toLocaleString() },
          { label: "Churned", value: funnel.churned.toLocaleString() },
        ]}
      />

      {/* Sourced and closed */}
      <section className="mb-10">
        <Overline as="h2" className="mb-2">
          Sourced and closed
        </Overline>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          Finding a deal and closing one are two jobs, so they are two columns. Attributed MRR
          counts won deals on accounts that are not comped, company managed or carved out.
        </p>
        {reps.length === 0 ? (
          <EmptyPanel title="Nobody has a deal against their name yet.">
            A person appears here once a deal names them as its sourcer or its closer.
          </EmptyPanel>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400">Person</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">Sourced</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">Sourced won</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">Closed won</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">Attributed MRR</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((rep) => (
                  <tr key={rep.user_id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {rep.full_name || rep.email || "No name set"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                      {rep.sourced_deals}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                      {rep.sourced_won} · {formatMoney(rep.sourced_won_cents)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 text-right tabular-nums">
                      {rep.closed_won} · {formatMoney(rep.closed_won_cents)}
                    </td>
                    <td className="px-4 py-3 text-xs text-white text-right tabular-nums">
                      {formatMoney(rep.attributed_mrr_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="mb-10">
        <Overline as="h2" className="mb-2">
          Activity, last {ACTIVITY_WEEKS} weeks
        </Overline>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          Counted off the timeline. This measures what was written down, which is not the same as
          what was done, and the gap between the two is the point of reading it.
        </p>
        {activity.length === 0 ? (
          <EmptyPanel title="Nothing logged in the last eight weeks.">
            Calls, meetings and emails appear here as they are recorded on a person&rsquo;s
            timeline. Logging a call is one button on the activities screen.
          </EmptyPanel>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
            {activity.map((rep) => (
              <div key={rep.userId} className="p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{rep.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {ACTIVITY_GROUPS.map(
                      (group) => `${rep.totals[group.id] ?? 0} ${group.label.toLowerCase()}`
                    ).join(", ")}
                  </p>
                </div>
                <WeekColumns weeks={rep.perWeek} />
                <span className="text-sm text-white tabular-nums w-12 text-right">{rep.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lifecycle funnel */}
      <section>
        <Overline as="h2" className="mb-2">
          Lifecycle funnel
        </Overline>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          Each rung counts everybody at it or past it, so somebody who skipped a stage is still
          counted by the stages below them. Churned sits outside the ladder: it is where people
          leave from rather than a step they reach.
        </p>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <Bars
            emptyLabel="Nobody in the contact table yet."
            data={funnel.steps.map((step) => ({
              id: step.id,
              label: step.label,
              value: step.people,
              display: step.people.toLocaleString(),
              hint:
                step.conversionPct === null ? undefined : `${step.conversionPct}% of the step above`,
              accent: step.id === "customer",
            }))}
          />
        </div>
      </section>
    </div>
  );
}
