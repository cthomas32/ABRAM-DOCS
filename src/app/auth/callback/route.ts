import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  
  let next = searchParams.get("next") ?? "/admin/dashboard";

  // If this is an invite or recovery type flow, force set-password
  if (type === "invite" || type === "recovery") {
    next = "/admin/set-password";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to login page with an authentication error flag
  return NextResponse.redirect(`${origin}/admin?error=auth-failed`);
}
