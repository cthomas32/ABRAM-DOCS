import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Banknote, Contact, Stamp, TriangleAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, seesWholePipeline, GROWTH_STAGE_LABELS } from "@/lib/auth/permissions";
import { formatMoney, OPEN_STAGE_IDS, stageSpec } from "@/lib/crm/constants";
import { registrationState } from "@/lib/crm/attribution";
import type { CrmContact, CrmDealRegistration } from "@/lib/crm/types";
import type { CommissionStatementRow } from "@/lib/growth/types";

/**
 * The first screen of the Growth workspace.
 *
 * Deliberately not a chart wall. What somebody running acquisition needs
 * on opening this is the same four things every morning: who is waiting
 * on a reply, what is claimed and about to lapse, what has been earned,
 * and where the board actually stands. Anything past that belongs on the
 * screen it is about.
 */

export const dynamic = "force-dynamic";

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
      {children}
    </span>
  );
}

export default async function GrowthOverviewPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  const supabase = await createClient();
  const wholePipeline = seesWholePipeline(user);

  // Every query below is already scoped by row level security. The
  // explicit owner filter on the "yours" query is a narrowing on top of
  // that, not the thing doing the protecting.
  const [contactsRes, mineRes, registrationsRes, statementRes] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("id, full_name, company, stage, next_follow_up_at, owner_user_id, last_activity_at")
      .eq("archived", false)
      .order("last_activity_at", { ascending: false })
      .limit(500),
    supabase
      .from("crm_contacts")
      .select("id, full_name, company, stage, next_follow_up_at")
      .eq("archived", false)
      .eq("owner_user_id", user.userId)
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", new Date().toISOString())
      .order("next_follow_up_at", { ascending: true })
      .limit(8),
    can(user, "crm.registrations.file")
      ? supabase
          .from("crm_deal_registrations")
          .select("*")
          .in("status", ["pending", "approved"])
          .order("requested_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as CrmDealRegistration[] }),
    can(user, "commission.read.own")
      ? supabase
          .from("commission_statement")
          .select("*")
          .eq("user_id", user.userId)
      : Promise.resolve({ data: [] as CommissionStatementRow[] }),
  ]);

  const contacts = (contactsRes.data ?? []) as Pick<
    CrmContact,
    "id" | "full_name" | "company" | "stage" | "next_follow_up_at" | "owner_user_id" | "last_activity_at"
  >[];
  const due = (mineRes.data ?? []) as Pick<
    CrmContact,
    "id" | "full_name" | "company" | "stage" | "next_follow_up_at"
  >[];
  const registrations = (registrationsRes.data ?? []) as CrmDealRegistration[];
  const statement = (statementRes.data ?? []) as CommissionStatementRow[];

  const currency = statement[0]?.currency ?? "USD";
  const lifetime = statement.reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
  const outstanding = statement.reduce((sum, row) => sum + (row.outstanding_cents ?? 0), 0);

  const openContacts = contacts.filter((c) => OPEN_STAGE_IDS.includes(c.stage));

  // A registration inside two weeks of lapsing is the one thing here that
  // gets worse by being ignored, so it is surfaced rather than counted.
  const lapsingSoon = registrations
    .map((registration) => ({
      registration,
      state: registrationState({
        status: registration.status,
        declineDeadlineAt: registration.decline_deadline_at,
        expiresAt: registration.expires_at,
      }),
    }))
    .filter(
      ({ state }) =>
        state.effective === "approved" && state.daysLeft !== null && state.daysLeft <= 14
    );

  const stageCounts = OPEN_STAGE_IDS.map((id) => ({
    id,
    spec: stageSpec(id),
    count: openContacts.filter((c) => c.stage === id).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <Overline>{user.growthStage ? GROWTH_STAGE_LABELS[user.growthStage] : "Growth"}</Overline>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {user.fullName ? `Morning, ${user.fullName.split(" ")[0]}` : "Growth"}
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          {wholePipeline
            ? "You are seeing the whole pipeline."
            : "You are seeing the accounts assigned to you."}
        </p>
      </header>

      {/* Due today */}
      <section className="mb-10">
        <Overline>Waiting on you</Overline>
        {due.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-zinc-400">Nothing is due today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {due.map((contact) => (
              <Link
                key={contact.id}
                href={`/growth/pipeline?contact=${contact.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3.5 min-h-11"
              >
                <div className="min-w-0">
                  <span className="text-sm text-white block truncate">{contact.full_name}</span>
                  {contact.company && (
                    <span className="text-[11px] text-zinc-500 block truncate">
                      {contact.company}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${stageSpec(contact.stage).badge}`}
                >
                  {stageSpec(contact.stage).label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Registrations about to lapse */}
      {lapsingSoon.length > 0 && (
        <section className="mb-10">
          <Overline>About to lapse</Overline>
          <div className="space-y-2">
            {lapsingSoon.map(({ registration, state }) => (
              <div
                key={registration.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5"
              >
                <div className="flex gap-2.5 min-w-0">
                  <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-sm text-white block truncate">
                      {registration.account_name}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      Registration attributes nothing after it expires.
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-400 shrink-0">
                  {state.daysLeft}d
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The board */}
      <section className="mb-10">
        <Overline>Open pipeline</Overline>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold tracking-tight text-white">
              {openContacts.length}
            </span>
            <span className="text-xs text-zinc-500">
              open {openContacts.length === 1 ? "contact" : "contacts"}
            </span>
          </div>

          {stageCounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stageCounts.map(({ id, spec, count }) => (
                <span
                  key={id}
                  className={`text-[11px] px-2.5 py-1 rounded-full border ${spec.badge}`}
                >
                  {spec.label} <span className="font-semibold ml-1">{count}</span>
                </span>
              ))}
            </div>
          )}

          <Link
            href="/growth/pipeline"
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors mt-4 min-h-11"
          >
            Open the board
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {can(user, "commission.read.own") && (
          <Link
            href="/growth/earnings"
            className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
          >
            <Banknote className="w-4 h-4 text-zinc-500 mb-2.5" />
            <span className="text-xs font-semibold text-white block">Earnings</span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              {lifetime > 0 ? formatMoney(lifetime, currency) : "Nothing collected yet"}
            </span>
            {outstanding > 0 && (
              <span className="text-[10px] text-amber-400 block mt-1">
                {formatMoney(outstanding, currency)} outstanding
              </span>
            )}
          </Link>
        )}

        {can(user, "crm.registrations.file") && (
          <Link
            href="/growth/registrations"
            className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
          >
            <Stamp className="w-4 h-4 text-zinc-500 mb-2.5" />
            <span className="text-xs font-semibold text-white block">Registrations</span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              {registrations.length} live
            </span>
          </Link>
        )}

        <Link
          href="/growth/pipeline"
          className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
        >
          <Contact className="w-4 h-4 text-zinc-500 mb-2.5" />
          <span className="text-xs font-semibold text-white block">Contacts</span>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            {contacts.length} in view
          </span>
        </Link>
      </section>
    </div>
  );
}
