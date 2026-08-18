import { NextResponse } from "next/server";
import { applySyncEvent, serviceClient } from "@/lib/growth/collectionsSyncService";
import { parseSyncEvent, verifySyncSignature } from "@/lib/growth/collectionsSync";

/**
 * Where money that arrived in the product lands in this ledger.
 *
 * abram-network owns Stripe. It queues every cash event in an outbox and
 * a scheduled function posts them here, signed HMAC-SHA256 over
 * `<timestamp>.<body>` with `DOCS_COLLECTIONS_SYNC_SECRET`. This URL is
 * public, so the signature is the only thing standing between it and
 * anybody who can write a commission entry for themselves — which is why
 * every failure below is refused before a single row is read.
 *
 * WHY THE BODY IS READ AS TEXT
 *
 * The signature is over the exact bytes that were sent. `request.json()`
 * parses and re-serialises, and a re-serialised object is not the same
 * string — key order, number formatting, whitespace. Verify the text,
 * then parse it.
 *
 * WHAT COMES BACK
 *
 * A refusal says nothing about why beyond a status code. A caller that
 * cannot sign a request has no business learning whether it was the
 * secret, the clock or the shape that was wrong; the real sender learns
 * all three from the response body on the success path and from our logs.
 *
 * The one exception is 409 for a duplicate, which is not a refusal — it
 * is the correct, expected answer to a redelivery, and the sender marks
 * the row delivered on it rather than retrying forever.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const verified = verifySyncSignature({
    secret: process.env.DOCS_COLLECTIONS_SYNC_SECRET ?? "",
    timestamp: request.headers.get("x-abram-sync-timestamp"),
    signature: request.headers.get("x-abram-sync-signature"),
    rawBody,
  });

  if (!verified.ok) {
    // Logged, not returned. A misconfigured secret and a forged request
    // look identical from the outside, on purpose.
    console.warn("[collections-sync] refused", { reason: verified.error });
    return NextResponse.json(
      { error: verified.error === "no_secret" ? "not_configured" : "unauthorized" },
      { status: verified.error === "no_secret" ? 503 : 401 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "malformed_json" }, { status: 400 });
  }

  const parsed = parseSyncEvent(body);
  if (!parsed.ok) {
    // A signed request with a bad shape IS worth explaining: it came from
    // us, and the sender treats 400 as permanent and stops retrying.
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    // 503 rather than 500: the sender retries this one, and the payment
    // waits in the outbox until the environment is fixed.
    console.error("[collections-sync] no service credentials configured");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const result = await applySyncEvent(supabase, parsed.event);

  if (result.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 409 });
  }

  if (!result.ok) {
    // 500 so the outbox backs off and tries again. Everything that is
    // genuinely unfixable by retrying was refused with a 400 above.
    console.error("[collections-sync] could not apply", {
      eventId: parsed.event.event_id,
      note: result.note,
    });
    return NextResponse.json({ error: result.note }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    collection_id: result.collectionId ?? null,
    deal_id: result.dealId ?? null,
    account_id: result.accountId ?? null,
    entries_written: result.entriesWritten ?? 0,
    note: result.note,
  });
}
