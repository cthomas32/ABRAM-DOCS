/**
 * Which design a code opens with.
 *
 * The designer is one component with more than one way in: the Codes tab
 * opens it on a particular printed thing, and the Your card tab opens it on
 * whichever code the card is handing out. Both need the same answer to
 * "what should be on screen before anybody touches a control", so the
 * answer lives here rather than in either screen.
 *
 * Nothing in this file talks to the database or draws anything.
 */

import {
  DEFAULT_QR_FORMAT,
  parseQrDesign,
  type QrDesignSpec,
  type QrFormatId,
} from "@/lib/crm/qrDesign";
import type { CrmCaptureCode, CrmProfile } from "@/lib/crm/types";

/**
 * A code row carries its saved design in an additive JSON column, which the
 * shared row type describes but an older database may not have. Read as
 * unknown and parsed defensively, so a missing column behaves exactly like
 * a code nobody has designed yet.
 */
type CodeWithDesign = CrmCaptureCode & { design?: unknown };

/** Role and company on one line, which is what a card caption wants. */
export function subtitleFor(profile: CrmProfile): string {
  const role = (profile.job_title || "").trim();
  const company = (profile.company || "").trim();
  if (role && company) return `${role} at ${company}`;
  return role || company;
}

/**
 * A code that was made for the back of a card opens on the back of a card.
 * Anything else opens on the lock screen, which is the default and the
 * reason most people come here at all.
 */
const FORMAT_BY_PLACEMENT: Record<string, QrFormatId> = {
  business_card: "business_card",
  badge: "badge_sticker",
  sticker: "badge_sticker",
  email_signature: "share_square",
  slide: "share_link",
};

/**
 * The design to open with: whatever was saved, otherwise a sensible one
 * built from the card. Somebody opening this for the first time should see
 * their own name under the code rather than an empty caption.
 */
export function designFor(code: CrmCaptureCode, profile: CrmProfile): QrDesignSpec {
  return parseQrDesign((code as CodeWithDesign).design, {
    name: profile.full_name,
    subtitle: subtitleFor(profile),
    format: FORMAT_BY_PLACEMENT[code.placement ?? ""] ?? DEFAULT_QR_FORMAT,
  });
}

/**
 * The code the Your card tab designs.
 *
 * A card usually has several codes and only one of them is the one being
 * handed out at the moment, so the pick is: the code made for the back of a
 * business card, then any live code, then whatever exists. A card with no
 * codes at all has nothing to design, and the screen says so instead.
 */
export function primaryCode(codes: CrmCaptureCode[]): CrmCaptureCode | null {
  const live = codes.filter((code) => code.is_active);
  const pool = live.length > 0 ? live : codes;
  return pool.find((code) => code.placement === "business_card") ?? pool[0] ?? null;
}
