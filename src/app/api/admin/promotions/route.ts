import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side proxy to the abram-network `admin-promotions` edge function.
 *
 * WHY A PROXY AND NOT A DIRECT CALL FROM THE BROWSER. Promo codes live in the PRODUCT's Supabase
 * project, not this marketing site's — the two are separate databases, and the code has to be
 * where checkout can see it. Reaching that project needs a credential, and a credential the
 * browser holds is a credential anyone who opens devtools holds. So the token stays in this route
 * handler, server-side, and the browser never sees it.
 *
 * The session check below is the real gate. `ABRAM_PROMO_ADMIN_TOKEN` proves the caller is THIS
 * APP; the Supabase session proves the caller is a signed-in admin OF this app. Without the second
 * check, any unauthenticated request to this route would be forwarded with full promo-admin
 * authority — the proxy would be the hole rather than the wall.
 */

const NETWORK_FUNCTIONS_URL = process.env.ABRAM_NETWORK_FUNCTIONS_URL || "";
const PROMO_ADMIN_TOKEN = process.env.ABRAM_PROMO_ADMIN_TOKEN || "";

/** Actions this proxy is willing to forward. `validate` is deliberately absent: it belongs to a
 *  buyer in the product, needs their org context, and has no business being reachable from here. */
const ALLOWED_ACTIONS = new Set([
  "list_campaigns",
  "create_campaign",
  "update_campaign",
  "create_codes",
  "list_codes",
  "set_code_status",
  "campaign_report",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!NETWORK_FUNCTIONS_URL || !PROMO_ADMIN_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Promotions are not configured. Set ABRAM_NETWORK_FUNCTIONS_URL and ABRAM_PROMO_ADMIN_TOKEN.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = String(body.action ?? "");
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${NETWORK_FUNCTIONS_URL}/admin-promotions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-abram-promo-token": PROMO_ADMIN_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    // Pass the upstream status through rather than flattening to 200/500: the admin UI shows the
    // edge function's own message (e.g. ECONOMICS_IMMUTABLE), and that message is the useful part.
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach the ABRAM network: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
