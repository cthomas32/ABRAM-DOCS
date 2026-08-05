"use client";

import ContactCardSurface, { type CardLink } from "@/components/crm/ContactCardSurface";
import CaptureForm from "@/components/crm/CaptureForm";

/**
 * The card as a stranger sees it.
 *
 * Everything visual lives in {@link ContactCardSurface}, which the admin
 * console renders too. This file exists only to hand that surface the real
 * capture form, the one with the outbox behind it. Keeping the drawing in
 * one component is what stops the preview in the console and the page in
 * somebody's hand from slowly becoming two different cards.
 */

export type { CardLink };

interface CardViewProps {
  slug: string;
  code: string | null;
  fullName: string;
  role: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  links: CardLink[];
}

export default function CardView({
  slug,
  code,
  fullName,
  role,
  tagline,
  avatarUrl,
  links,
}: CardViewProps) {
  return (
    <main>
      <ContactCardSurface
        slug={slug}
        fullName={fullName}
        role={role}
        tagline={tagline}
        avatarUrl={avatarUrl}
        links={links}
        formSlot={<CaptureForm slug={slug} code={code} ownerName={fullName} />}
      />
    </main>
  );
}
