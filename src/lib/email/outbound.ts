/**
 * THE SEND SWITCH. Nothing in this application emails anybody unless this
 * file says it may, and by default it does not.
 *
 * WHY IT EXISTS. There are nine places that can put mail in front of a
 * real person: the welcome, a campaign broadcast, a batch send, a
 * conference follow up, a contact email, a template test. Each was
 * individually sensible and collectively they meant that any bug, any
 * backfill, any well meant "let us just retry the failed ones" could mail
 * thirty people who signed up months ago. A list you have mailed by
 * accident cannot be unmailed.
 *
 * FAIL CLOSED. `EMAIL_SENDING_ENABLED` must be exactly the string "true".
 * Absent, empty, "1", "yes", "TRUE" and every typo all mean blocked. This
 * is deliberate and is the opposite of the usual convention for a feature
 * flag: the default for a flag that costs nothing when wrong is on, and
 * the default for a flag that mails strangers when wrong is off.
 *
 * WHAT IS NOT BLOCKED. Managing Resend audiences, reading segments,
 * rendering a template, saving a draft, and marking a post ready are all
 * untouched. None of them delivers anything. The block is on delivery,
 * so the console keeps working and only the last step refuses.
 *
 * HOW TO TURN IT ON, when that day comes: set `EMAIL_SENDING_ENABLED=true`
 * in the environment for the one deployment that should send. Do not set
 * it in `.env.local` and forget, because local runs point at the
 * production database and the production Resend key.
 *
 * BEFORE TURNING IT ON, read the welcome backfill note in
 * `docs/plans/crm-console-handoff.md`. Thirty people on the list have
 * `welcome_email_sent_at` null and joined months ago; switching sending on
 * without stamping them first sends thirty late welcomes in one burst.
 */

/** The exact string, and nothing else. */
export function sendingAllowed(): boolean {
  return process.env.EMAIL_SENDING_ENABLED === "true";
}

/**
 * What a blocked send says.
 *
 * Written for whoever is looking at a log or a toast wondering why
 * nothing arrived, so it names the flag rather than saying "failed".
 */
export const SENDING_BLOCKED_MESSAGE =
  "Email sending is switched off for this deployment, so nothing was delivered. " +
  "Set EMAIL_SENDING_ENABLED=true to allow it. See src/lib/email/outbound.ts.";

/**
 * The guard every send path calls first.
 *
 * Returns null when sending is allowed, and a reason when it is not, so a
 * caller writes `const blocked = blockedReason(); if (blocked) return ...`
 * and cannot accidentally treat "blocked" as success.
 */
export function blockedReason(): string | null {
  return sendingAllowed() ? null : SENDING_BLOCKED_MESSAGE;
}

/**
 * Says so once per process rather than once per recipient.
 *
 * A blocked batch of four hundred should not write four hundred lines,
 * but total silence is how somebody spends an afternoon wondering why the
 * campaign did nothing.
 */
let announced = false;
export function announceBlocked(context: string): void {
  if (announced) return;
  announced = true;
  console.warn(`[email blocked] ${context}. ${SENDING_BLOCKED_MESSAGE}`);
}
