import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml, robots.txt (dynamic metadata routes)
     * - llms.txt, llms-full.txt (static llms specifications)
     * - search-index.json (static search index)
     * - api/track (landing page telemetry ingest, no session needed)
     * - api/mcp (the MCP server authenticates with a bearer token and
     *   opens its own database session; a cookie refresh here would do
     *   nothing except add a round trip to every tool call)
     * - .well-known (the OAuth discovery documents, which are public,
     *   cacheable and read by clients that hold no cookie at all)
     * - api/oauth (registration and token exchange, authenticated by
     *   PKCE and the code itself rather than by a session)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|llms-full\\.txt|search-index\\.json|api/track|api/mcp|api/oauth|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
