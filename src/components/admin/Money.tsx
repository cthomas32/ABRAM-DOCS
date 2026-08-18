/**
 * Cents to a display string, in one place.
 *
 * Every screen that shows an amount was dividing by 100 on its own, which
 * is four chances to get the rounding, the currency or the zero case
 * different from the screen next to it. `formatMoney` already existed and
 * is still the function to call from server code and from arithmetic.
 * This is the same thing for JSX, plus the tabular figures that keep a
 * column of numbers aligned.
 */

import React from "react";
import { formatMoney } from "@/lib/crm/constants";

export default function Money({
  cents,
  currency = "USD",
  className = "",
}: {
  cents: number | null | undefined;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${className}`}>{formatMoney(cents, currency)}</span>
  );
}

export { formatMoney };
