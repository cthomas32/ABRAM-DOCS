import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { ConsoleUser } from "@/lib/auth/permissions";
import type { GrowthPartnerTerms } from "@/lib/growth/types";
import PeopleManager from "./PeopleManager";

/**
 * Who has a login, what it lets them do, and what a close pays them.
 *
 * These three used to be a sentence in an agreement and nothing in the
 * software. Putting them on one screen is the point: a role that is set
 * in one place and a commission rate that is remembered in another is how
 * somebody ends up with access they should have lost, or a payment
 * calculated at last year's rate.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "People & Access | ABRAM Admin",
  robots: { index: false, follow: false },
};

export interface PersonRow extends ConsoleUser {
  invitedAt: string | null;
  createdAt: string;
  terms: GrowthPartnerTerms | null;
}

export default async function PeoplePage() {
  const viewer = await getConsoleUser();
  if (!viewer) redirect("/admin");
  if (!can(viewer, "roles.manage")) redirect("/admin/dashboard");

  const supabase = await createClient();

  const [usersRes, termsRes] = await Promise.all([
    supabase
      .from("admin_users")
      .select("user_id, email, full_name, role, growth_stage, member_id, is_active, invited_at, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("growth_partner_terms")
      .select("*")
      .is("effective_to", null),
  ]);

  const openTerms = new Map<string, GrowthPartnerTerms>();
  for (const row of (termsRes.data ?? []) as GrowthPartnerTerms[]) {
    openTerms.set(row.user_id, row);
  }

  const people: PersonRow[] = (usersRes.data ?? []).map((row) => ({
    userId: row.user_id as string,
    email: row.email as string,
    fullName: (row.full_name as string | null) ?? null,
    role: row.role as ConsoleUser["role"],
    growthStage: (row.growth_stage as ConsoleUser["growthStage"]) ?? null,
    memberId: (row.member_id as string | null) ?? null,
    isActive: Boolean(row.is_active),
    invitedAt: (row.invited_at as string | null) ?? null,
    createdAt: row.created_at as string,
    terms: openTerms.get(row.user_id as string) ?? null,
  }));

  return <PeopleManager people={people} viewerId={viewer.userId} />;
}
