# Conference capture and the CRM

Someone at an event scans a printed code, lands on a card, saves your contact and leaves their own. Those details become a contact with a pipeline stage, a timeline and follow ups. This file covers how that works and the decisions behind it.

## The one idea

A person standing in a conference hall is the least patient reader you will ever have, on the worst network your software will ever meet. Every decision below follows from that. The card is server rendered and chrome free. The form asks for a name and treats everything else as optional. A submission is written to the device before it is sent, so a failed request is never a lost person.

## Surfaces

| Route | What it is |
|---|---|
| `/c/<slug>` | The public card. Save my contact, plus the form. Renders bare, `noindex`. |
| `/c/<slug>/vcf` | The vCard download, version 3.0 for maximum phone compatibility. |
| `/api/crm/capture` | Ingest. The most important route in the system. |
| `/api/crm/scan` | Scan telemetry, fired on card load. |
| `/admin/dashboard/crm` | The console. Pipeline, Events, Codes, Your card. |
| `/admin/dashboard/crm/capture` | Offline capture mode, for when their phone has no signal. |
| `/admin/dashboard/crm/print?k=<code>` | Printable code sheet, one, four or nine per page. |

## Codes

A code is a row in `crm_capture_codes` and a short token in the URL: `abram.network/c/connor?k=bg`. The token says which printed copy was scanned, so a lanyard badge, a booth banner and a business card back are measurable separately.

Codes are deliberately two characters. Every character in a QR payload pushes the code to a higher version with more modules, and more modules means a phone must be held closer and steadier. There is no redirect hop for the same reason: one request is all a bad network can be trusted with.

## Designing a code

Codes tab, **Design** on any code. Templates, themes and the backdrop photo library come from the Social Studio, and the spec is stored on `crm_capture_codes.design` so a design is previewable before any file exists, the same way a social card works.

Seven sizes: three lock screen wallpapers, a business card back, a badge sticker, and the two share formats. On a wallpaper the code sits around 0.55 of the frame height, between the clock and the torch and camera buttons, at 26 pixels per module on the large size so it reads off a screen at arm's length.

Scannability is enforced rather than advised. There is a four module quiet zone, module size is floored to whole pixels, and a 10:1 contrast floor that removes failing combinations from the picker rather than warning about them. The optional ABRAM mark cutout costs 6 of the 13 error correction codewords available at this version, leaving the rest for glare and creases.

**How solid the plate is** is the one place that discipline had to change shape rather than hold still. The plate began as an opaque light rectangle, which made contrast a property of two hex values and nothing else. It now has three settings, and the floor is kept by measurement rather than by construction:

- **Solid** is the default and the only choice for anything printed. Two hex values, one ratio, no pixels involved.
- **Frosted** is translucent with the picture blurred behind it, which is what lets you read through a shower door. The blur is load bearing: it flattens the photograph into a near uniform field, and a near uniform field is one a single contrast reading can stand behind. It has two controls, and both of them are filtered. Densities and blurs that would drop the code under the floor are absent from the lists rather than offered with a caution.
- **Clear** puts the modules straight onto the photograph with no plate at all. There is no control here to filter, so it gets the smallest correction that works instead: a veil of the plate colour, raised in small steps until the worst square under the code clears the floor, usually none at all. Past half a veil it stops being a clear code, so beyond that the answer is no and the mode is disabled with the reason in words.

The measurement is the whole thing. The backdrop is drawn once at about ninety six cells across the shorter edge, the region the code will occupy is read back, and the tint is composited over those cells in sRGB, which is where a browser does its alpha blending and therefore the only space in which the number matches the pixels. Frosted is measured on the blurred grid because that is what gets drawn. Clear is measured cell by cell and the **worst** cell decides, since a photograph that averages to a comfortable mid grey can still have a blown out cloud in one corner, and that corner is where the code stops decoding. An average would wave it through.

The ink can also be any colour rather than one of five, with the live ratio against the field under the code shown beside it. Two conditions hold: the pairing clears the floor, and the modules stay the darker of the two, since every reader assumption and every printed path in this system takes the positive polarity for granted.

A design that fails is drawn anyway in the studio so the problem is visible, and saving and downloading are held shut until it clears. Every other path gets the enforced picture, which falls back to the opaque plate. A design saved before any of this existed comes back solid and redraws exactly as it did.

**Focus depth** throws the photograph behind the code out of focus, in four steps from sharp to a deep bokeh. It exists because a sharp picture and a hard edged code are both detail at the same distance and the eye has to be told which one it is reading. The blur is a fraction of the frame's shorter edge rather than a pixel count, so one saved design reads the same on a lock screen and on a card back, and it is a Gaussian standard deviation, which is the same number `blur()` takes on a canvas and `feGaussianBlur` takes in a vector file. The plate, the modules and the type are never drawn through it. A picture blurred at its own bounds leaves a soft transparent rim, so the image box is drawn three standard deviations larger on every side and the rim lands off frame.

If you change how a code is drawn, decode the output before shipping it. That is the only proof that means anything here. A code that looks right and fails across a hall is worse than the plain black square.

The harness rasterises a scene, puts it through a camera model (distance, defocus, a reflection sliding across the frame, sensor noise), binarizes it in local blocks the way a phone does, finds the finder patterns by their 1:1:3:1:1 run, lays a grid, reads the format word, unmasks, de-interleaves and runs Reed-Solomon over GF(256), and compares the result to the exact payload. Its block tables are written from the standard rather than imported from the encoder in this repository, so a mistake shared by both would have to be made twice.

The first pass over `src/lib/crm/qrDesign.ts` rendered 168 images: every template against every size at every focus depth with the mark cutout on and off. The plate work added 109 more: frosted at five densities and four blurs over four genuinely different pictures, clear over each of them at three darkening levels, and custom inks sitting exactly on the floor and just above it. Every one of the 69 the guard allowed decoded on both cameras. Of the 40 it refused, 11 were unreadable when forced through, which is the guard earning its keep rather than being cautious.

Printed codes are always black on white with a four module quiet zone, regardless of the dark theme around them.

## Offline

Three layers, because the network is the thing most likely to fail:

1. **Write before send.** A capture goes into IndexedDB first (`src/lib/crm/offlineQueue.ts`), then gets sent. Retries fire on reconnect, on tab focus, every thirty seconds, and on next page load.
2. **Idempotency.** Every payload carries a `client_token` generated on the device. A retry that actually landed the first time updates the same row rather than creating a second one.
3. **Capture mode.** When their phone has no bars at all, you hold yours. `/admin/dashboard/crm/capture` works with the network fully off after first load and queues to the same outbox.

The ingest route returns 4xx only for genuinely unfixable payloads: empty name, unknown slug, unparseable JSON. Everything else that could recover returns 503 or 429, because a 4xx is the one response that makes the queue discard the person permanently.

## Dedupe

In order: `client_token`, then case insensitive email on non archived rows for the same profile, then insert. The email lookup escapes `%`, `_` and `\` and re verifies the match in JavaScript, so a wildcard in a typed address can never return somebody else's contact. A rescan updates the existing row and logs a `rescan` interaction, so meeting the same person at a second conference does not create a second record. Existing data is never blanked out by a sparser resubmission.

## Notifications

Both run after the row is committed and neither can fail the capture:

- **vCard email** through Resend to the contact, if they gave an address. Skipped silently when no key is configured, leaving `vcard_sent_at` null.
- **Slack ping** to `SLACK_CRM_WEBHOOK_URL`, falling back to `SLACK_TRIAGE_WEBHOOK_URL` then `SLACK_WEBHOOK_URL`. Sets `notified_at`. A duplicate does not ping again.

## Who the card says you are

Name, job title, photograph and city live once, in `team_members`, and are read by blog bylines and by contact cards. A card may override any of them, which is what lets somebody present differently at an event than in a byline without keeping two copies of the truth. Both sides resolve identity through `resolveIdentity` in `src/lib/crm/identity.ts`, so they cannot drift.

Change a photograph in the team screen at `/admin/dashboard/team` and the byline, the card, the vCard and the email signature all follow.

**Your card** draws the card on a handset beside the fields and updates it as you type, resolving the same fallback, so a value coming through from the team record shows up in the picture and is marked as inherited on the field it came through. The preview is a replica rather than the real page: `/c/<slug>` is public and server rendered and nothing in the console imports it, because it is the one page that must never break. The designer opens from here too, on the card's own code, which is the same component the Codes tab opens.

## Subscribers

Consent is the only bridge. A contact becomes a subscriber only when the consent box was ticked, read back from the committed row rather than trusted from the request, and only through the same `addSubscriber` path the site's own newsletter form uses. `crm_contacts.subscriber_id` is both the link and the idempotency marker, so an offline retry cannot add somebody twice.

Going the other way, a newsletter signup matches against existing contacts by address and writes a note on their timeline. It never creates a contact and never edits `consent_marketing`, because that column records what happened at the capture and overwriting it would blur the audit trail.

Nobody who did not tick the box is ever added to a list. Preserve that.

## Tables

`crm_profiles`, `crm_events`, `crm_capture_codes`, `crm_scans`, `crm_contacts`, `crm_interactions`, `crm_tasks`, `crm_stage_changes`, plus the `crm_event_stats` view. Schema in `supabase/migrations/20260804120000_crm_conference_capture.sql`.

Every table carries `profile_id` even though there is one profile today, so adding a teammate later is a row rather than a migration.

Scans store a daily rotating salted hash of the IP and user agent, never a raw address, matching the landing page telemetry. Only the service role may write from the public side; the console reads and writes as a signed in admin.

Stages are `new`, `contacted`, `qualified`, `opportunity`, `won`, `lost`. A stage move writes three rows: the contact update, a `crm_stage_changes` row, and a `stage_change` interaction, so the funnel is measured rather than guessed at.

## Before an event

1. Fill in your card under **Your card**. The profile ships with almost every column null, and the public card and the vCard both render from it.
2. Create the event under **Events** and set it active. Scans from codes that do not name an event attribute to whichever event is active.
3. Print the codes you need from **Codes**.

## Shared contract

`src/lib/crm/` holds what both halves agree on: `constants.ts` (stages, kinds, placements, limits, URL builders), `types.ts` (row shapes, one for one with the migration), `vcard.ts`, and `offlineQueue.ts`. A column added to the migration belongs in `types.ts` on the same pass.
