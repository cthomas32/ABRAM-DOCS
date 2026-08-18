import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { BarChart3 } from "lucide-react";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import Bars from "@/components/admin/Bars";
import { DEAL_STAGES, formatMoney } from "@/lib/crm/constants";
import {
  nextQuarter,
  quarterOf,
  weighForecast,
  type PipelineRow,
} from "@/lib/crm/reports";

/**
 * What the pipeline is worth, weighted.
 *
 * It lives on the deals object rather than on the reports screen because
 * a forecast away from the board it came off is a number nobody can
 * check. The person who wants to know why Q3 moved wants to be one click
 * from the deal that moved it.
 *
 * The weights are a published ladder in src/lib/crm/constants.ts rather
 * than a probability typed onto each deal. A per-deal probability is a
 * number two people argue about and nobody maintains; a stage weight can
 * be checked by looking at the board.
 */

function stageLabel(stage: string): string {
  return DEAL_STAGES.find((entry) => entry.id === stage)?.label ?? stage;
}

export default async function ForecastPanel() {
  const user = await getConsoleUser();

  if (!user || !can(user, "reports.read")) {
    return (
      <Panel title="The forecast is not open to your role">
        A forecast counts every deal in the company, including the ones on accounts that are not
        yours. Ask an owner if you need it.
      </Panel>
    );
  }

  const supabase = await createClient();
  const thisQuarter = quarterOf(new Date());
  const following = nextQuarter(thisQuarter);

  const [pipelineRes, currentRes, nextRes] = await Promise.all([
    supabase.rpc("crm_report_pipeline"),
    supabase.rpc("crm_report_forecast", { p_from: thisQuarter.from, p_to: thisQuarter.to }),
    supabase.rpc("crm_report_forecast", { p_from: following.from, p_to: following.to }),
  ]);

  const pipeline = rows<PipelineRow>(pipelineRes);
  const currentForecast = weighForecast(rows<PipelineRow>(currentRes));
  const nextForecast = weighForecast(rows<PipelineRow>(nextRes));

  const open = pipeline.filter((row) => row.stage !== "won" && row.stage !== "lost");
  const openValue = open.reduce((sum, row) => sum + row.amount_cents, 0);
  const openCount = open.reduce((sum, row) => sum + row.deals, 0);
  const won = pipeline.find((row) => row.stage === "won");

  return (
    <div className="space-y-8">
      {pipelineRes.error && (
        <Panel title="The figures could not be read">
          Reporting reads across everybody, which is a permission of its own. Ask an owner to check
          your access, or sign in again.
        </Panel>
      )}

      <StatRow
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
            value: formatMoney(won?.amount_cents ?? 0),
            hint: `${won?.deals ?? 0} closed`,
          },
        ]}
      />

      <section>
        <Overline as="h2" className="mb-4">
          By stage
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

      <section>
        <Overline as="h2" className="mb-2">
          Weighted by quarter
        </Overline>
        <p className="text-[11px] text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          A deal with no expected close date is counted nowhere here. That is deliberate: a
          forecast that quietly assumes a date is a forecast that will be wrong without saying so.
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
                  No open deal has an expected close date in this quarter.
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
    </div>
  );
}
