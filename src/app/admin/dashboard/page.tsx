import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Contact, Handshake, Phone } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import Panel from "@/components/admin/Panel";
import Bars from "@/components/admin/Bars";
import { buildFunnel, type LifecycleRow } from "@/lib/crm/reports";

/**
 * The front door.
 *
 * Four objects, what each one holds, and the one action that makes
 * another. That is the whole page, and the restraint is the point: the
 * console had grown twenty destinations and the founder's complaint about
 * it was exact. A landing screen that itself tries to be a dashboard is
 * how twenty destinations become twenty-one.
 *
 * The counts are `head: true` counts rather than reads. A number on this
 * page must never cost the same as opening the screen it points at, and
 * row level security still scopes them: a partner sees their own count.
 *
 * The funnel is here because it is the one number about the whole CRM
 * rather than about one object in it. Everything else that rolls up lives
 * on the money screen, in one place, as asked.
 */

export const dynamic = "force-dynamic";

/**
 * A count rather than a read.
 *
 * `head: true` asks Postgres for the number and no rows, so the landing
 * screen never costs what opening the screen it points at costs. Row
 * level security still applies: a partner scoped to their own accounts
 * gets their own count, which is the correct number for them.
 *
 * A refused count returns null and is drawn as "not readable", because a
 * zero where the reader simply has no access is a lie.
 */
type Count = { count: number | null; error: unknown };

function readCount(result: Count): number | null {
  return result.error ? null : result.count ?? 0;
}

export default async function CrmHomePage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const supabase = await createClient();

  const [peopleRes, companiesRes, dealsRes, tasksRes, lifecycleRes] = await Promise.all([
    supabase.from("crm_contacts").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase.from("crm_accounts").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase
      .from("crm_deals")
      .select("id", { count: "exact", head: true })
      .not("stage", "in", "(won,lost)"),
    supabase.from("crm_tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    can(user, "reports.read")
      ? supabase.rpc("crm_report_lifecycle")
      : Promise.resolve({ data: null, error: null }),
  ]);

  const people = readCount(peopleRes);
  const companies = readCount(companiesRes);
  const deals = readCount(dealsRes);
  const openTasks = readCount(tasksRes);
  const funnel = buildFunnel(rows<LifecycleRow>(lifecycleRes));

  const objects = [
    {
      id: "people",
      label: "People",
      icon: Contact,
      count: people,
      hint: "Everybody, however they arrived",
      href: "/admin/dashboard/crm/people",
      newHref: "/admin/dashboard/crm/capture",
      newLabel: "Capture somebody",
      permitted: can(user, "crm.contacts.read.own"),
    },
    {
      id: "companies",
      label: "Companies",
      icon: Building2,
      count: companies,
      hint: "The accounts people roll up to",
      href: "/admin/dashboard/accounts",
      newHref: "/admin/dashboard/accounts",
      newLabel: "New company",
      permitted: can(user, "crm.accounts.manage"),
    },
    {
      id: "deals",
      label: "Deals",
      icon: Handshake,
      count: deals,
      hint: "Open, and what each is worth",
      href: "/admin/dashboard/deals",
      newHref: "/admin/dashboard/deals",
      newLabel: "New deal",
      permitted: can(user, "crm.deals.manage"),
    },
    {
      id: "activities",
      label: "Activities",
      icon: Phone,
      count: openTasks,
      hint: "Follow ups open, and everything logged",
      href: "/admin/dashboard/activities",
      newHref: "/admin/dashboard/activities?tab=calls",
      newLabel: "Log a call",
      permitted: can(user, "crm.contacts.read.own"),
    },
  ].filter((object) => object.permitted);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {user.fullName ? `Morning, ${user.fullName.split(" ")[0]}` : "The CRM"}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
            Four objects. A person, the company they are at, the money on it, and everything that
            has happened.
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2">
          {objects.map((object) => {
            const Icon = object.icon;
            return (
              <li
                key={object.id}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/15 transition-colors"
              >
                <Link href={object.href} className="block">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <Overline>{object.label}</Overline>
                      <span className="block text-2xl text-white tabular-nums mt-1">
                        {object.count === null ? "Not readable" : object.count.toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-zinc-400 mt-1">{object.hint}</span>
                    </span>
                    <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                  </span>
                </Link>
                <Link
                  href={object.newHref}
                  className="btn-glass mt-4 px-4 h-9 text-[11px] font-medium rounded-full inline-flex"
                >
                  {object.newLabel}
                </Link>
              </li>
            );
          })}
        </ul>

        {can(user, "reports.read") && (
          <section className="mt-10">
            <Overline as="h2" className="mb-4">
              Lifecycle funnel
            </Overline>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <Bars
                emptyLabel="Nobody in the contact table yet."
                data={funnel.steps.map((step) => ({
                  id: step.id,
                  label: step.label,
                  value: step.people,
                  display: step.people.toLocaleString(),
                  hint:
                    step.conversionPct === null
                      ? undefined
                      : `${step.conversionPct}% of the step above`,
                  accent: step.id === "customer",
                }))}
              />
            </div>
          </section>
        )}

        {objects.length === 0 && (
          <Panel title="Nothing in the CRM is open to your role">
            Ask an owner what you should be able to see.
          </Panel>
        )}
      </div>
    </div>
  );
}
