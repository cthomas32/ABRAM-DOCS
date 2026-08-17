import CrmConsole from "@/app/admin/dashboard/crm/page";

/**
 * The pipeline, inside the Growth shell.
 *
 * This renders the same component the admin console does rather than a
 * second copy of it. Two boards that were meant to be identical are two
 * boards that stop being identical, usually in the month somebody is
 * relying on one of them.
 *
 * What differs between the two doors is not the component, it is who gets
 * through and what they then see:
 *
 *   * The shell around it — a growth partner never renders the admin
 *     console chrome, so the docs editor and the mailing list are not
 *     merely hidden from them, they are not on the page.
 *   * The rows — every query the console makes goes through row level
 *     security, so an Advisor gets their own accounts and a Head of
 *     Growth gets the whole board from the same code.
 *
 * That second point is the reason this is safe to share. The component
 * does no filtering of its own and never has; it asks for contacts and
 * renders what comes back.
 */

export const metadata = {
  title: "Pipeline | ABRAM Growth",
  robots: { index: false, follow: false },
};

export default function GrowthPipelinePage() {
  return <CrmConsole />;
}
