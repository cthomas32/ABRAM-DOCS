import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { BarChart3 } from "lucide-react";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import Bars, { WeekColumns } from "@/components/admin/Bars";
import { DEAL_STAGES, formatMoney } from "@/lib/crm/constants";
import {
  ACTIVITY_GROUPS,
  buildFunnel,
  foldActivity,
  nextQuarter,
  quarterOf,
  weighForecast,
  type ActivityRow,
  type CommissionRow,
  type LifecycleRow,
  type PipelineRow,
  type RepRow,
} from "@/lib/crm/reports";

/**
 * The numbers, across everybody.
 *
 * Every other screen on this console is scoped: a partner sees their own
 * accounts, their own statement, their own queue. This one is the
 * exception, and the exception is the whole reason it needed six
 * SECURITY DEFINER functions rather than six queries. Row level security
 * is doing its job when it refuses a cross-company read; a rollup has to
 * be granted deliberately, to a named set of people, and to nobody else.
 *
 * So the guard is in three places and they agree: the route table, this
 * page, and `public.can_read_reports()` in the database. The commission
 * section has a fourth and stricter one, because what everybody is owed
 * is an owner's figure rather than a Head of Growth's.
 *
 * Nothing here is a live figure. Every number is a count or a sum over
 * rows somebody entered, and where a number would be misleading without
 * its basis, the basis is next to it.
 */

export const dynamic = "force-dynamic";

const ACTIVITY_WEEKS = 8;

function stageLabel(stage: string): string {
  return DEAL_STAGES.find((entry) => entry.id === stage)?.label ?? stage;
}

export default async function ReportsPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "reports.read")) redirect("/admin/dashboard");

  const supabase = await createClient();
  const thisQuarter = quarterOf(new Date());
  const following = nextQuarter(thisQuarter);
  const seesCommission = can(user, "commission.manage");

  const [pipelineRes, currentRes, nextRes, repRes, activityRes, lifecycleRes, commissionRes] =
    await Promise.all([
      supabase.rpc("crm_report_pipeline"),
      supabase.rpc("crm_report_forecast", { p_from: thisQuarter.from, p_to: thisQuarter.to }),
      supabase.rpc("crm_report_forecast", { p_from: following.from, p_to: following.to }),
      supabase.rpc("crm_report_by_rep"),
      supabase.rpc("crm_report_activity", { p_weeks: ACTIVITY_WEEKS }),
      supabase.rpc("crm_report_lifecycle"),
      seesCommission
        ? supabase.rpc("crm_report_commission")
        : Promise.resolve({ data: null, error: null }),
    ]);

  const pipeline = rows<PipelineRow>(pipelineRes);
  const currentForecast = weighForecast(rows<PipelineRow>(currentRes));
  const nextForecast = weighForecast(rows<PipelineRow>(nextRes));
  const reps = rows<RepRow>(repRes);
  const activity = foldActivity(rows<ActivityRow>(activityRes));
  const funnel = buildFunnel(rows<LifecycleRow>(lifecycleRes));
  const commission = rows<CommissionRow>(commissionRes);

  // One sentence rather than six, because "reporting is not available to
  // your role" six times reads as six problems.
  const refused = [pipelineRes, currentRes, nextRes, repRes, activityRes, lifecycleRes].some(
    (result) => result.error
  );

  const openPipeline = pipeline.filter((row) => row.stage !== "won" && row.stage !== "lost");
  const openValue = openPipeline.reduce((sum, row) => sum + row.amount_cents, 0);
  const wonValue = pipeline
    .filter((row) => row.stage === "won")
    .reduce((sum, row) => sum + row.amount_cents, 0);
  const wonCount = pipeline.find((row) => row.stage === "won")?.deals ?? 0;
  const openCount = openPipeline.reduce((sum, row) => sum + row.deals, 0);

  const owed = commission.reduce((sum, row) => sum + row.outstanding_cents, 0);
  const paidOut = commission.reduce((sum, row) => sum + row.paid_cents, 0);
  const currency = commission[0]?.currency ?? "USD";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          What the pipeline says
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
          {
            label: "Open pipeline",
            value: formatMoney(openValue),
            hint: `${openCount} ${openCount === 1 ? "deal" : "deals"} not yet closed`,
          },
          {
            label: `Weighted, ${thisQuarter.label}`,
            value: formatMoney(currentForecast.weightedCents),
            hint: `of ${formatMoney(currentForecast.totalCents)} expected to close`,
          },
          {
            label: `Weighted, ${following.label}`,
            value: formatMoney(nextForecast.weightedCents),
            hint: `of ${formatMoney(nextForecast.totalCents)} expected to close`,
          },
          {
            label: "Won, all time",
            value: formatMoney(wonValue),
            hint: `${wonCount} ${wonCount === 1 ? "deal" : "deals"}`,
          },
        ]}
      />

      {/* Pipeline by stage */}
      <section className="mb-10">
        <Overline as="h2" className="mb-4">
          Pipeline by stage
        </Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          {pipeline.length === 0 ? (
            <EmptyPanel title="No deals yet." icon={<BarChart3 className="w-6 h-6" />}>
              A stage appears here the moment a deal is in it. Until then there is no pipeline to
              measure, which is a fact rather than a gap.
            </EmptyPanel>
          ) : (
            <Bars
              data={DEAL_STAGES.map((stage) => {
                const row = pipeline.find((entry) => entry.stage === stage.id);
                return {
                  id: stage.id,
                  label: stage.label,
                  value: row?.amount_cents ?? 0,
                  display: formatMoney(row?.amount_cents ?? 0),
                  hint: `${row?.deals ?? 0}`,
                  accent: stage.id === "negotiation",
                };
              })}
            />
          )}
        </div>
      </section>

      {/* Forecast */}
      <section className="mb-10">
        <Overline as="h2" className="mb-2">
          Weighted forecast
        </Overline>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          Each stage is multiplied by a published probability rather than by a number typed onto the
          deal. The weights are the same for everybody and they are written down in
          src/lib/crm/constants.ts, so a forecast can be checked by looking at the board.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            { quarter: thisQuarter, forecast: currentForecast },
            { quarter: following, forecast: nextForecast },
          ].map(({ quarter, forecast }) => (
            <div key={quarter.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <span className="text-sm text-white">{quarter.label}</span>
                <span className="text-sm text-white tabular-nums">
                  {formatMoney(forecast.weightedCents)}
                </span>
              </div>
              {forecast.deals === 0 ? (
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  No open deal has an expected close date in this quarter. A deal with no date is
                  not counted, here or anywhere else.
                </p>
              ) : (
                <Bars
                  max={Math.max(...forecast.byStage.map((row) => row.amountCents), 1)}
                  data={forecast.byStage.map((row) => ({
                    id: row.stage,
                    label: stageLabel(row.stage),
                    value: row.weightedCents,
                    display: formatMoney(row.weightedCents),
                    hint: `${row.deals} at ${Math.round(row.probability * 100)}%`,
                  }))}
                />
              )}
            </div>
          ))}
        </div>
      </section>

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
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400">
                    Person
                  </th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">
                    Sourced
                  </th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">
                    Sourced won
                  </th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">
                    Closed won
                  </th>
                  <th className="px-4 py-3 text-xs uppercase font-bold tracking-widest text-gray-400 text-right">
                    Attributed MRR
                  </th>
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
            timeline. Logging a call is one button on the follow up queue.
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
      <section className="mb-10">
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
          {funnel.churned > 0 && (
            <p className="text-[11px] text-zinc-400 mt-4 pt-4 border-t border-white/5">
              {funnel.churned} {funnel.churned === 1 ? "person has" : "people have"} churned. They
              are counted nowhere above.
            </p>
          )}
        </div>
      </section>

      {/* Commission across everybody */}
      {seesCommission && (
        <section>
          <Overline as="h2" className="mb-2">
            Commission owed and paid
          </Overline>
          <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
            Across everybody, from the same ledger each partner reads their own half of. It stays at
            zero until collected payments are mirrored into this database.
          </p>
          {commission.length === 0 ? (
            <EmptyPanel title="No commission has been accrued.">
              Commission is calculated on cash that has arrived. Nothing writes a collection row
              yet, so every figure here would be zero and the zero is honest.
            </EmptyPanel>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <StatRow
                className="mb-5 border-0 bg-transparent px-0 py-0"
                stats={[
                  { label: "Outstanding", value: formatMoney(owed, currency) },
                  { label: "Paid", value: formatMoney(paidOut, currency) },
                ]}
              />
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
          )}
        </section>
      )}
    </div>
  );
}
