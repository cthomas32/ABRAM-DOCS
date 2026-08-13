# The marketing funnel

What happens to somebody between arriving on the site and becoming a conversation. This file covers the shape it is being built into, the decisions behind it, and where KIPP's hands are allowed.

`seo-audit.js` answers *can the world find us*. This answers *what happens once it does*.

## The one idea

**The funnel is a stage column on a contact, not a separate system.** Everything below follows from that. There is one row per person, it carries where they are in the journey, and the email list is one of the things attached to it rather than a parallel universe of its own. A funnel built as its own database is a funnel that disagrees with the CRM within a month, and the disagreement is always discovered in front of somebody.

## The spine

Three stores held people before this, and none of them reconciled:

| Store | What it knew | What it did not |
|---|---|---|
| `subscribers` | Email, consent, Resend mirror | Anything about the person or where they were |
| `crm_contacts` | Person, stage, timeline, tasks, follow ups | Anybody who had not been to a conference |
| `landing_visits`, `link_hub_visits`, `crm_scans` | Behaviour, utm, device | Who any of it was |

The decision, 2026-08-13: **`crm_contacts` becomes the spine for every lead**, not just the ones met at events. A newsletter signup creates a contact at the `subscriber` stage the same way a scan creates one at `met`. `subscribers` stops being a people table and becomes what it always really was — the state of one channel.

- `crm_contacts` — the person, the stage, the history. One row per human.
- `subscribers` — consent, list flags, Resend contact id, welcome state. Zero or one per contact.
- `crm_contacts.subscriber_id` — the join, which already existed before this decision and already carries the consent discipline in `src/lib/crm/subscriberLink.ts`.

**Why not a new `people` table.** It reads cleaner on a whiteboard and it throws away working code. `subscriberLink.ts` encodes a rule that took thought — *a contact becomes a subscriber only when they ticked the box themselves* — and any fresh spine would have to re-derive it, probably less carefully. The `crm_` prefix now means "the contact system" rather than "the conference thing". That is a naming cost paid once, against a migration cost paid forever.

**Two funnels, one spine.** ABRAM has a self-serve motion (visitor → subscriber → signup) and an enterprise one (inbound or conference → qualified → demo → deal). They are not the same journey and should never be forced into the same stages, but they are the same *people table*. One pipeline board, a stage set per motion.

## Rung zero: measurement

Nothing above works without engagement data, and there was none.

`campaign_logs` held `email.sent`, `email.delivered` and `email.bounced` and nothing else — no opens, no clicks, across 791 rows. `src/app/api/webhooks/resend/route.ts` has handled `email.opened` and `email.clicked` since it was written, so **this is a dashboard configuration gap, not a code gap**: tracking is not enabled on the sending domain, or those event types are not on the webhook subscription.

It matters more than it sounds. Opens and clicks are the substrate for segments, lead scoring, re-engagement triggers, and the simple question of whether a campaign worked. Every one of those features silently produces a plausible wrong answer when the data is absent rather than failing loudly.

`node scripts/funnel-audit.js --human` reports this in words, as an error, with the fix attached. It is the reason that script exists.

**To fix, in the Resend dashboard:** enable open and click tracking on the sending domain, then add `email.opened` and `email.clicked` to the webhook subscription. No deploy involved.

## The welcome email

The first automatic email the list sends, and as of this file the only one.

It lives in the same registry as the conference follow up (`src/lib/crm/emailTemplates.ts`, key `newsletter_welcome`), goes through the same store, the same fallbacks and the same editor at `/admin/dashboard/crm/emails`. Four rules hold it up, and they are in the file header of `src/lib/funnel/welcomeEmail.ts` because they are the kind of thing that gets refactored away by somebody who does not know why they are there:

1. **It never fails the signup.** Nothing in it throws.
2. **It sends once**, guarded by a *conditional* claim on `subscribers.welcome_email_sent_at` — the update only matches while the column is null, so two racing requests produce one send. The claim happens **before** the send, which means a send that fails after claiming leaves somebody permanently unwelcomed. That is the deliberate trade: the alternative sends duplicates exactly when mail is already misbehaving.
3. **No unsubscribe link, no send.**
4. **The copy is editable without a deploy**, and a saved edit that will not render loses to the copy the build ships with.

The column had existed since 2026-06-24 and nothing had ever written it. Thirty people were on the list and none had been welcomed.

### Variable scoping

A conference note and a welcome share a renderer and almost nothing else. Templates now declare which variables they may use, and a saved edit reaching outside that set is refused at save time, at send time, and greyed out of the editor's palette.

This is the one class of template mistake that survives every other guard: `{{save_contact_link}}` in a welcome email has matched braces, renders without error, and arrives as a silent blank space in a stranger's inbox.

### Unsubscribing

Built as part of the welcome, because a marketing email without a working way off the list is a legal problem and a deliverability one.

`GET /api/newsletter/unsubscribe` **asks**; `POST` performs. That split is not politeness — links in an inbox get fetched by machines, and a GET that unsubscribes would be quietly emptied by corporate scanners and link previews without a single person clicking. One-click (RFC 8058) arrives as a POST already, so it lands correctly and answers in plain text rather than HTML.

The token is an HMAC over the address rather than a row in a table: a bare email in the link is an invitation to unsubscribe strangers from the address bar, and a random id needs storage written before the send and cleaned up after. The key falls back to the service role key so no new secret blocks a send; set `NEWSLETTER_UNSUBSCRIBE_SECRET` to separate them, remembering that rotating it invalidates links already sitting in inboxes.

## Sequences — not built yet

The intended shape, recorded so it is designed once:

- `email_sequences` — a named journey with an entry condition and an owner.
- `sequence_steps` — ordered, each with a delay, a template key and a send condition.
- `sequence_enrollments` — person, sequence, current step, `next_send_at`, status. A cron finds what is due, renders, sends, advances.

Exits matter as much as steps: unsubscribed, replied, converted, or enrolled in something else. A sequence with no exit condition mails people who have already bought.

**A global frequency governor, checked at send time.** Not per sequence — a hard cap per person per week across every sequence and broadcast combined. This is the thing most marketing tools get wrong, it is cheap on day one and miserable to retrofit, and it is the only real defence against three separate well-meaning automations landing on the same person on the same morning.

**The approval line has to change shape here, and it is the one place this system departs from the Social Studio.** A card is a spec until somebody clicks, and nothing posts by itself. A drip sequence cannot work that way — the entire point is that step four fires at 3am on day 4. So: **a person approves the sequence once; enrollments then flow automatically.** You approve the journey, not each send. Say that out loud before building it, because it is a real loosening and it should be a decision rather than a drift.

## What KIPP may and may not do here

Stricter than the social rules, deliberately. A bad social post is embarrassing and deletable. A bad email is neither, and it spends sending-domain reputation that takes months to rebuild.

**KIPP may, alone:**

- Draft sequence copy and propose new sequences, as PRs.
- Run `funnel-audit.js` and report what it finds.
- Produce the weekly funnel report: what converted, where the drop-off is, which content produced leads.
- Propose segment definitions and re-scoring rules.
- Flag a claim in live email copy that has gone stale against `BUSINESS.md` or the plans registry.

**KIPP may never:**

- Press send to a list, or activate a sequence.
- Change anybody's consent state, list membership, or subscription status.
- Edit a sequence that people are currently enrolled in. Editing step 4 while forty people sit at step 3 mails something nobody reviewed — a proposed edit becomes a new version, and enrollments finish on the version they started.
- Define or reorder pipeline stages.
- Write to `subscribers`, `crm_contacts`, or any `crm_*` table.

The asymmetry is the point. KIPP's judgment is trusted on *what the words should say*, which is reversible, and not on *who receives them*, which is not.

## Things that will bite you

- **`subscribers.status` was `subscribed` for every row.** It is not a lifecycle field and never was; the unsubscribe route now writes `unsubscribed` to it. Anything wanting lifecycle reads the contact's stage.
- **Audience ids have hardcoded fallbacks** in `src/utils/resend.ts`. Reading `RESEND_MARKETING_SEGMENT_ID` from the environment somewhere else finds nothing on a deploy relying on the fallback, and fails silently. Import `MARKETING_SEGMENT_ID` / `APPLICATION_SEGMENT_ID` instead — the first draft of the unsubscribe route got this wrong and would have left everybody in the Resend audience.
- **A backfill of the welcome to existing subscribers is a judgment call, not a chore.** A welcome arriving four months after signup reads as a mistake. `funnel-audit.js` reports the gap as a warning rather than an error for that reason; a re-introduction campaign is usually the better answer.
- **`landing_visits` never resolves to a person.** 113 visits, zero identified. Until conversion stamps utm and landing path onto the contact, the funnel can count people but cannot say what produced them — which is exactly the question KIPP's weekly report exists to answer.
