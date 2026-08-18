import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows, readWarning } from "@/lib/supabase/rows";
import type {
  CrmSequence,
  CrmSequenceEnrollment,
  CrmSequenceStep,
} from "@/lib/crm/sequences";
import SequencesManager, { type EnrolledPerson } from "./SequencesManager";

/**
 * Sequences: the third follow up, made.
 *
 * Row level security scopes all three reads. A partner sees the
 * sequences they own; an owner sees everybody's. Enrolments are stricter
 * again, because they need the person to be visible as well as the
 * sequence.
 */

export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.sequences.manage")) redirect("/admin/dashboard");

  const supabase = await createClient();

  const [sequencesRes, stepsRes, enrollmentsRes, contactsRes] = await Promise.all([
    supabase.from("crm_sequences").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_sequence_steps").select("*"),
    supabase
      .from("crm_sequence_enrollments")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("crm_contacts")
      .select("id, full_name, company, email")
      .eq("archived", false)
      .order("last_activity_at", { ascending: false })
      .limit(1000),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <SequencesManager
        sequences={rows<CrmSequence>(sequencesRes)}
        steps={rows<CrmSequenceStep>(stepsRes)}
        enrollments={rows<CrmSequenceEnrollment>(enrollmentsRes)}
        contacts={rows<EnrolledPerson>(contactsRes)}
        warning={readWarning(sequencesRes, "Your sequences")}
      />
    </div>
  );
}
