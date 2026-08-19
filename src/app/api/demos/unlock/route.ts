/**
 * The one door into /demos.
 *
 * A form post, deliberately: no fetch, no JSON, no state in the client.
 * The password is checked here and the answer leaves as a cookie, so a
 * browser that never runs script can still get in and the password never
 * appears in a URL, a log line or a bundle.
 *
 * A wrong password comes back to the page with `?locked=1`, which is the
 * only thing the form knows about failure. There is no rate limiting and
 * no lockout — see src/lib/demosGate.ts for why that is the right size of
 * defence for a shared curtain.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  demosCookieOptions,
  passwordMatches,
  safeDemosReturn,
} from "@/lib/demosGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const target = safeDemosReturn(form.get("next"));

  if (!passwordMatches(form.get("password"))) {
    const back = new URL(target, request.nextUrl.origin);
    back.searchParams.set("locked", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(target, request.nextUrl.origin), {
    status: 303,
  });
  response.cookies.set(demosCookieOptions());
  return response;
}
