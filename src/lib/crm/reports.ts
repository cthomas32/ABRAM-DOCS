/**
 * The shapes the reporting functions return, and the arithmetic done on
 * top of them.
 *
 * Everything here is pure. The database counts and sums; this weights,
 * buckets and labels, which keeps the one number anybody argues about —
 * the weighted forecast — in a file that can be read in thirty seconds
 * rather than in a function nobody can run locally.
 *
 * The six functions are defined in
 * supabase/migrations/20260818100000_crm_reports_sequences_views.sql, all
 * SECURITY DEFINER behind `public.can_read_reports()`.
 */

import { DEAL_STAGE_PROBABILITY, type DealStage } from "./constants";

/* ------------------------------------------------------------------ */
/*  Row shapes                                                         */
/* ------------------------------------------------------------------ */

export interface PipelineRow {
  stage: DealStage;
  deals: number;
  amount_cents: number;
  mrr_cents: number;
}

export interface RepRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  sourced_deals: number;
  sourced_won: number;
  sourced_won_cents: number;
  closed_won: number;
  closed_won_cents: number;
  attributed_mrr_cents: number;
}

export interface ActivityRow {
  user_id: string;
  full_name: string | null;
  week_start: string;
  kind: string;
  events: number;
}

export interface LifecycleRow {
  lifecycle_stage: string;
  people: number;
}

export interface CommissionRow {
  user_id: string;
  full_name: string | null;
  currency: string;
  earned_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  months: number;
}

/* ------------------------------------------------------------------ */
/*  Quarters                                                           */
/* ------------------------------------------------------------------ */

export interface Quarter {
  /** `2026-Q3`. Sorts and reads the same way. */
  id: string;
  label: string;
  /** Inclusive, `YYYY-MM-DD`. */
  from: string;
  /** Exclusive, so a deal closing on the last day of a quarter lands once. */
  to: string;
}

function iso(year: number, monthIndex: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** The quarter a date falls in, counted in UTC so it does not move by machine. */
export function quarterOf(when: Date): Quarter {
  const year = when.getUTCFullYear();
  const index = Math.floor(when.getUTCMonth() / 3);
  const startMonth = index * 3;
  const endYear = startMonth + 3 > 11 ? year + 1 : year;
  const endMonth = (startMonth + 3) % 12;

  return {
    id: `${year}-Q${index + 1}`,
    label: `Q${index + 1} ${year}`,
    from: iso(year, startMonth),
    to: iso(endYear, endMonth),
  };
}

export function nextQuarter(quarter: Quarter): Quarter {
  const [, month] = quarter.to.split("-");
  const year = Number(quarter.to.slice(0, 4));
  return quarterOf(new Date(Date.UTC(year, Number(month) - 1, 1)));
}

/* ------------------------------------------------------------------ */
/*  Weighting                                                          */
/* ------------------------------------------------------------------ */

export interface WeightedForecast {
  /** Every open deal in the window, unweighted. */
  totalCents: number;
  /** The same set, each stage multiplied by its published probability. */
  weightedCents: number;
  deals: number;
  /** Per stage, so the weighting is visible rather than asserted. */
  byStage: {
    stage: DealStage;
    deals: number;
    amountCents: number;
    weightedCents: number;
    probability: number;
  }[];
}

/**
 * A forecast, with its own working shown.
 *
 * Won and lost are dropped rather than weighted. A won deal is revenue and
 * belongs in the commission numbers; a lost one is not a forecast at all.
 */
export function weighForecast(rows: PipelineRow[]): WeightedForecast {
  const open = rows.filter((row) => row.stage !== "won" && row.stage !== "lost");

  const byStage = open.map((row) => {
    const probability = DEAL_STAGE_PROBABILITY[row.stage] ?? 0;
    return {
      stage: row.stage,
      deals: row.deals,
      amountCents: row.amount_cents,
      weightedCents: Math.round(row.amount_cents * probability),
      probability,
    };
  });

  return {
    totalCents: byStage.reduce((sum, row) => sum + row.amountCents, 0),
    weightedCents: byStage.reduce((sum, row) => sum + row.weightedCents, 0),
    deals: byStage.reduce((sum, row) => sum + row.deals, 0),
    byStage,
  };
}

/* ------------------------------------------------------------------ */
/*  Activity                                                           */
/* ------------------------------------------------------------------ */

/** The kinds the activity report counts, grouped the way a week is read. */
export const ACTIVITY_GROUPS: { id: string; label: string; kinds: string[] }[] = [
  { id: "calls", label: "Calls", kinds: ["call"] },
  { id: "meetings", label: "Meetings", kinds: ["meeting", "demo"] },
  { id: "emails", label: "Emails", kinds: ["email_sent"] },
  { id: "notes", label: "Notes", kinds: ["note"] },
];

export interface RepActivity {
  userId: string;
  name: string;
  /** Totals across the window, by group id. */
  totals: Record<string, number>;
  /** Everything they logged, whichever group it fell in. */
  total: number;
  /** One count per week, oldest first, for the sparkline row. */
  perWeek: { week: string; events: number }[];
}

/**
 * The activity rows folded into one line per person.
 *
 * Weeks with nothing in them are not filled in here. A person who logged
 * nothing in week three has no row for week three, and the chart draws the
 * gap rather than inventing a zero that looks like a reading.
 */
export function foldActivity(rows: ActivityRow[]): RepActivity[] {
  const byUser = new Map<string, RepActivity>();
  const groupFor = (kind: string) =>
    ACTIVITY_GROUPS.find((group) => group.kinds.includes(kind))?.id ?? null;

  for (const row of rows) {
    const existing = byUser.get(row.user_id) ?? {
      userId: row.user_id,
      name: row.full_name ?? "Somebody with no name set",
      totals: {},
      total: 0,
      perWeek: [] as { week: string; events: number }[],
    };

    const group = groupFor(row.kind);
    if (group) existing.totals[group] = (existing.totals[group] ?? 0) + row.events;
    existing.total += row.events;

    const week = existing.perWeek.find((entry) => entry.week === row.week_start);
    if (week) week.events += row.events;
    else existing.perWeek.push({ week: row.week_start, events: row.events });

    byUser.set(row.user_id, existing);
  }

  for (const entry of byUser.values()) {
    entry.perWeek.sort((a, b) => a.week.localeCompare(b.week));
  }

  return [...byUser.values()].sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------ */
/*  Funnel                                                             */
/* ------------------------------------------------------------------ */

export interface FunnelStep {
  id: string;
  label: string;
  people: number;
  /** Of the step above. Null for the first step and where the step above is empty. */
  conversionPct: number | null;
}

/**
 * The lifecycle counts as a funnel.
 *
 * Each rung counts everybody at that rung *or past it*, which is the only
 * reading of a funnel that does not fall apart the moment somebody skips a
 * stage. `churned` is deliberately outside the ladder: it is where people
 * leave from, not a step they progress to.
 */
export function buildFunnel(rows: LifecycleRow[]): { steps: FunnelStep[]; churned: number } {
  const ladder = [
    { id: "subscriber", label: "Subscriber" },
    { id: "lead", label: "Lead" },
    { id: "mql", label: "Marketing qualified" },
    { id: "sql", label: "Sales qualified" },
    { id: "customer", label: "Customer" },
  ];

  const count = (id: string) =>
    rows.find((row) => row.lifecycle_stage === id)?.people ?? 0;

  const steps: FunnelStep[] = ladder.map((rung, index) => {
    const atOrPast = ladder
      .slice(index)
      .reduce((sum, later) => sum + count(later.id), 0);
    return { id: rung.id, label: rung.label, people: atOrPast, conversionPct: null };
  });

  for (let i = 1; i < steps.length; i++) {
    const above = steps[i - 1].people;
    steps[i].conversionPct = above > 0 ? Math.round((steps[i].people / above) * 100) : null;
  }

  return { steps, churned: count("churned") };
}
