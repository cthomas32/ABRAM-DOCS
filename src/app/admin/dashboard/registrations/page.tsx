import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { registrationState } from "@/lib/crm/attribution";
import {
  REGISTRATION_DECLINE_BUSINESS_DAYS,
  REGISTRATION_VALID_DAYS,
  REGISTRATION_STATUSES,
} from "@/lib/crm/constants";
import type { CrmDealRegistration } from "@/lib/crm/types";
import RegistrationForm from "./RegistrationForm";
import Overline from "@/components/admin/Overline";
import { EmptyPanel } from "@/components/admin/Panel";

/**
 * Claiming a named account.
 *
 * The third attribution rule, and the only one that involves a human
 * decision — the other two are facts read off a checkout. So this is the
 * only part of attribution with a screen: everything else is derived and
 * shown, and this is filed.
 *
 * Two clocks run from a filing and the interface shows both, because they
 * fail in opposite directions. The five business day window is the
 * company's chance to say the account is already in progress; letting it
 * lapse *approves* the claim, which is the kind of silent outcome that
 * has to be visible before it happens rather than explained afterwards.
 * The 120 day window is the partner's deadline to close it.
 */

export const dynamic = "force-dynamic";

function statusSpec(id: string) {
  return REGISTRATION_STATUSES.find((s) => s.id === id) ?? REGISTRATION_STATUSES[0];
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default async function RegistrationsPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.registrations.file")) redirect("/admin/dashboard");

  const supabase = await createClient();

  // Row level security already limits a partner to their own filings and
  // shows an owner everything, so no user filter is applied here.
  const { data } = await supabase
    .from("crm_deal_registrations")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);

  const registrations = (data ?? []) as CrmDealRegistration[];
  const canDecide = can(user, "crm.registrations.decide");

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Claim a named account
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          Register a company you intend to approach, before anybody here has spoken to them. An
          approved registration attributes the deal to you if it closes within{" "}
          {REGISTRATION_VALID_DAYS} days.
        </p>
      </header>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 mb-8">
        <Overline as="h2" className="mb-2 text-white">How this is decided</Overline>
        <ul className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed list-disc pl-4">
          <li>
            A registration only counts if it was filed <strong className="text-zinc-300">before</strong>{" "}
            first contact with the account.
          </li>
          <li>
            There are {REGISTRATION_DECLINE_BUSINESS_DAYS} business days to decline it, if the
            account is already in progress. After that it stands.
          </li>
          <li>
            It attributes nothing if the deal closes more than {REGISTRATION_VALID_DAYS} days after
            filing.
          </li>
          <li>
            A promo code redeemed at checkout or a tracked link at signup both outrank this. First
            match governs.
          </li>
        </ul>
      </div>

      <RegistrationForm />

      <section className="mt-10">
        <Overline className="mb-4">Filed</Overline>

        {registrations.length === 0 ? (
          <EmptyPanel title="Nothing registered yet.">
            A registration you file appears here with both of its clocks running: the five business
            days to decline it, and the {REGISTRATION_VALID_DAYS} days to close it.
          </EmptyPanel>
        ) : (
          <div className="space-y-2.5">
            {registrations.map((registration) => {
              const state = registrationState({
                status: registration.status,
                declineDeadlineAt: registration.decline_deadline_at,
                expiresAt: registration.expires_at,
              });
              const spec = statusSpec(state.effective);

              return (
                <div
                  key={registration.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white break-words">
                        {registration.account_name}
                      </h3>
                      {registration.account_domain && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 break-words">
                          {registration.account_domain}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${spec.badge}`}
                    >
                      {spec.label}
                      {state.autoApproved && " (by default)"}
                    </span>
                  </div>

                  {registration.rationale && (
                    <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed break-words">
                      {registration.rationale}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-zinc-500">
                      Filed {formatDay(registration.requested_at)}
                    </span>
                    {state.effective === "pending" && (
                      <span className="text-[10px] text-amber-400">
                        Can be declined until {formatDay(registration.decline_deadline_at)}
                      </span>
                    )}
                    {state.daysLeft !== null && state.effective === "approved" && (
                      <span
                        className={`text-[10px] ${
                          state.daysLeft <= 14 ? "text-amber-400" : "text-zinc-500"
                        }`}
                      >
                        {state.daysLeft} {state.daysLeft === 1 ? "day" : "days"} left to close
                      </span>
                    )}
                    {registration.decision_reason && (
                      <span className="text-[10px] text-zinc-500 break-words">
                        {registration.decision_reason}
                      </span>
                    )}
                  </div>

                  {canDecide && registration.status === "pending" && (
                    <p className="text-[10px] text-zinc-600 mt-3">
                      Awaiting your decision. Declining after{" "}
                      {formatDay(registration.decline_deadline_at)} has no effect.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
