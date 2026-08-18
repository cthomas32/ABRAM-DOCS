import type { CrmDeal } from "@/lib/crm/types";
import { DEAL_STAGES, attributionSpec, formatMoney } from "@/lib/crm/constants";

/**
 * Deals as a spreadsheet.
 *
 * The contact export already existed and the plan asked for this one, and
 * the shape is deliberately the same: a byte order mark so Excel reads
 * UTF-8, quoted cells, CRLF endings. Amounts are written as a formatted
 * figure rather than as cents, because the file is opened by a person
 * rather than by a program, and a column of 450000 is a column somebody
 * will read as four hundred and fifty thousand dollars.
 */

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function dealsToCsv(
  deals: CrmDeal[],
  accountNameById: Record<string, string>,
  memberNameById: Record<string, string>
): string {
  const headers = [
    "Deal",
    "Company",
    "Stage",
    "Amount",
    "MRR",
    "Currency",
    "Billing",
    "Expected close",
    "Owner",
    "Sourced by",
    "Closed by",
    "Attribution",
    "Closed at",
  ];

  const lines = [headers.map(cell).join(",")];

  for (const deal of deals) {
    lines.push(
      [
        deal.name,
        accountNameById[deal.account_id] ?? "",
        DEAL_STAGES.find((entry) => entry.id === deal.stage)?.label ?? deal.stage,
        formatMoney(deal.amount_cents, deal.currency),
        formatMoney(deal.mrr_cents, deal.currency),
        deal.currency,
        deal.billing_period,
        deal.expected_close_on ?? "",
        (deal.owner_user_id && memberNameById[deal.owner_user_id]) || "",
        (deal.sourced_by && memberNameById[deal.sourced_by]) || "",
        (deal.closed_by && memberNameById[deal.closed_by]) || "",
        attributionSpec(deal.attribution_rule).label,
        deal.closed_at ?? "",
      ]
        .map(cell)
        .join(",")
    );
  }

  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * The bands the amount filter offers.
 *
 * Fixed bands rather than two number inputs. Nobody types a range; they
 * want "the big ones", and a band somebody can press is worth more than
 * a pair of boxes that need a number in cents.
 */
export const AMOUNT_BANDS: { value: string; label: string; range: [number | null, number | null] }[] =
  [
    { value: "under-5k", label: "Under $5k", range: [null, 500_000] },
    { value: "5k-25k", label: "$5k to $25k", range: [500_000, 2_500_000] },
    { value: "25k-100k", label: "$25k to $100k", range: [2_500_000, 10_000_000] },
    { value: "over-100k", label: "Over $100k", range: [10_000_000, null] },
  ];
