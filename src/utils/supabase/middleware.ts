import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  can,
  landingPathFor,
  permissionForPath,
  type ConsoleRole,
  type ConsoleUser,
  type GrowthStage,
} from "@/lib/auth/permissions";

/**
 * Session refresh, and the first of two locks on every guarded page.
 *
 * The second lock is row level security in the database, and that is the
 * one that actually protects data — this one protects the *experience*.
 * Without it a growth partner typing /admin/dashboard/blog gets a page
 * that renders its chrome and then fills with empty tables and permission
 * errors, which reads as a broken product rather than as a closed door.
 *
 * The role lookup costs a query, so it only runs on paths that are
 * actually guarded. Everything public — which is nearly the whole site —
 * pays nothing for it.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /** Carries the refreshed auth cookies onto a redirect, so signing in is not undone by being sent somewhere. */
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  };

  const requiredPermission = permissionForPath(pathname);

  // `/admin/set-password` is reachable by anybody with a live session and
  // has no permission of its own: somebody who has just been invited has
  // to be able to set a password before they have anywhere to go.
  const isSetPassword = pathname.startsWith("/admin/set-password");

  /* ---------------------------------------------------------------- */
  /*  Not signed in                                                    */
  /* ---------------------------------------------------------------- */
  if (!user) {
    if (requiredPermission || isSetPassword) return redirectTo("/admin");
    return supabaseResponse;
  }

  /* ---------------------------------------------------------------- */
  /*  Signed in                                                        */
  /* ---------------------------------------------------------------- */

  // Only pay for the role lookup where a decision depends on it.
  const needsRole = Boolean(requiredPermission) || pathname === "/admin";

  let consoleUser: Pick<ConsoleUser, "role" | "growthStage" | "isActive"> | null = null;

  if (needsRole) {
    const { data } = await supabase
      .from("admin_users")
      .select("role, growth_stage, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    consoleUser = data
      ? {
          role: data.role as ConsoleRole,
          growthStage: (data.growth_stage as GrowthStage | null) ?? null,
          isActive: Boolean(data.is_active),
        }
      : null;
  }

  // The login page sends people onward to wherever they actually belong.
  // landingPathFor returns "/admin" for somebody with no permissions,
  // which is what stops this from becoming a redirect loop.
  if (pathname === "/admin") {
    const destination = landingPathFor(consoleUser);
    if (destination !== "/admin") return redirectTo(destination);
    // Signed in with no console access at all. Say so, rather than
    // showing a sign-in form to somebody who is already signed in.
    if (!consoleUser || !consoleUser.isActive) return redirectTo("/admin/no-access");
    return supabaseResponse;
  }

  if (isSetPassword) return supabaseResponse;

  if (requiredPermission) {
    if (!can(consoleUser, requiredPermission)) {
      // Send them to the part of the building they do have keys to, so a
      // mistyped URL lands somewhere useful instead of on an error.
      const destination = landingPathFor(consoleUser);
      return redirectTo(destination === "/admin" ? "/admin/no-access" : destination);
    }
  }

  return supabaseResponse;
}
