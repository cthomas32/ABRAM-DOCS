import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { EmptyPanel } from "@/components/admin/Panel";
import { IDENTITY_SELECT, resolveIdentity } from "@/lib/crm/identity";
import { loadCrmEmailContent } from "@/lib/crm/emailTemplateStore";
import { crmEmailTemplateSpec, renderCrmEmail } from "@/lib/crm/emailTemplates";
import { captureEmailValues } from "@/lib/crm/emailValues";
import Composer from "./Composer";

/**
 * One email, to one person, opened from the thing that says to send it.
 *
 * A sequence's email step becomes a follow up named "Send: …" carrying a
 * template key. This is where that follow up leads. The template is
 * rendered against the real person and the real signature, and then it is
 * a text box: the copy is a starting point rather than a send, and the
 * only thing that makes an email leave this console is somebody reading
 * it and pressing send.
 *
 * `sendContactEmail` does the real checking. This page renders a form,
 * and a form is not a permission.
 */

export const dynamic = "force-dynamic";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string; template?: string; task?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.contacts.read.own")) redirect("/admin/dashboard");

  const params = await searchParams;
  const supabase = await createClient();

  const back = (
    <Link
      href="/admin/dashboard/tasks"
      className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full"
    >
      Back to the queue
    </Link>
  );

  if (!params.contact) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <EmptyPanel title="No person named." action={back}>
          This screen opens from a follow up that says who it is to. Reached on its own it has
          nobody to write to.
        </EmptyPanel>
      </div>
    );
  }

  // Read through the caller's session, so row level security decides
  // whether they are allowed near this person at all.
  const [contactRes, profileRes] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("id, full_name, email, company, job_title, archived")
      .eq("id", params.contact)
      .maybeSingle(),
    supabase
      .from("crm_profiles")
      .select(IDENTITY_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const contact = contactRes.data as {
    id: string;
    full_name: string;
    email: string | null;
    company: string | null;
    job_title: string | null;
    archived: boolean;
  } | null;

  if (!contact) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <EmptyPanel title="That person is not one you can reach." action={back}>
          Either the record has gone, or it belongs to somebody else&rsquo;s accounts.
        </EmptyPanel>
      </div>
    );
  }

  /* The template is a starting point. A key this build does not know, a
     saved edit that will not render, an absent card: all of them end with
     an empty box rather than with an error, because the person is sitting
     in front of a name they meant to write to. */
  let subject = "";
  let body = "";
  const spec = params.template ? crmEmailTemplateSpec(params.template) : null;

  if (spec) {
    const loaded = await loadCrmEmailContent(supabase, spec.key);
    const identity = profileRes.data
      ? resolveIdentity(profileRes.data as unknown as Parameters<typeof resolveIdentity>[0])
      : null;

    if (loaded && identity) {
      const rendered = renderCrmEmail(
        loaded.content,
        captureEmailValues({
          profile: identity,
          toName: contact.full_name,
          company: contact.company,
          jobTitle: contact.job_title,
        })
      );
      subject = rendered.subject;
      body = rendered.text;
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Write to {contact.full_name}
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          {spec
            ? `Started from "${spec.name}". Edit anything. It is your name on it.`
            : "A blank note, sent from your address and recorded on their timeline."}
        </p>
      </header>

      <Composer
        contactId={contact.id}
        to={contact.email}
        archived={contact.archived}
        canSend={can(user, "crm.email.send")}
        taskId={params.task ?? null}
        initialSubject={subject}
        initialBody={body}
      />
    </div>
  );
}
