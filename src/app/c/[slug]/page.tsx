import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { externalHref, getCardProfile, prettyHost } from "./profile";
import CardView, { type CardLink } from "./CardView";

/**
 * A contact card, reached by scanning a printed code at an event.
 *
 * The reader is standing in a loud hall on borrowed wifi, so the data is
 * resolved on the server and the page ships one column of markup. The card
 * is deliberately kept out of search: it is for the person holding the
 * phone, not for an index.
 */

export const dynamic = "force-dynamic";

interface CardPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 40) return null;
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getCardProfile(slug);

  const noIndex = { index: false, follow: false } as const;

  if (!profile) {
    return { title: "Card not found", robots: noIndex };
  }

  const where = profile.company ? ` at ${profile.company}` : "";

  return {
    title: `${profile.full_name}${profile.company ? ` · ${profile.company}` : ""}`,
    description: `Contact card for ${profile.full_name}${where}. Save the details, or leave your own.`,
    robots: noIndex,
  };
}

export default async function CardPage({ params, searchParams }: CardPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const profile = await getCardProfile(slug);

  if (!profile) notFound();

  const code = firstParam(query.k);
  const website = externalHref(profile.website);
  const linkedin = externalHref(profile.linkedin_url);
  const calendar = externalHref(profile.calendar_url);
  const cta = externalHref(profile.cta_url);

  const links: CardLink[] = [];
  if (website) links.push({ href: website, label: prettyHost(website), kind: "website" });
  if (linkedin) links.push({ href: linkedin, label: "LinkedIn", kind: "linkedin" });
  if (calendar) links.push({ href: calendar, label: "Book a time", kind: "calendar" });
  if (cta && profile.cta_label) links.push({ href: cta, label: profile.cta_label, kind: "cta" });

  return (
    <CardView
      slug={profile.slug}
      code={code}
      fullName={profile.full_name}
      role={[profile.job_title, profile.company].filter(Boolean).join(" · ") || null}
      tagline={profile.tagline}
      avatarUrl={profile.avatar_url}
      links={links}
    />
  );
}
