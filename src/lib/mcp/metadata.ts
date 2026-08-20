import { CORS_HEADERS, MCP_PATH, SCOPE } from "./oauth";
import { issuerOrigin } from "./origin";

/**
 * The two documents that turn a blank page into a sign-in screen.
 *
 * A client handed `WWW-Authenticate: Bearer` and nothing else has no way
 * to learn where to send somebody, so it guesses the endpoint names at
 * the origin and shows whatever comes back. These make the guessing
 * unnecessary: the 401 from `/api/mcp` now points at the protected
 * resource document, that document names the authorization server, and
 * the server document names the three endpoints.
 *
 * Served at two addresses each. The path-suffixed form is the one
 * RFC 9728 specifies for a resource with a path, and the bare form is
 * what a client that has not read it closely tries first. They are four
 * lines of routing and they remove an entire class of "it just says
 * unreachable" from the setup.
 */

/** Every discovery document. Public, cacheable, no cookie ever read. */
const DOC_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  /* Five minutes. Long enough that a client probing four addresses pays
     for one, short enough that fixing a wrong endpoint is not a day of
     explaining caches to somebody. */
  "Cache-Control": "public, max-age=300",
  ...CORS_HEADERS,
};

function doc(body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), { status: 200, headers: DOC_HEADERS });
}

/** RFC 9728. What this resource is and who vouches for callers. */
export async function protectedResourceDocument(): Promise<Response> {
  const origin = await issuerOrigin();
  return doc({
    resource: `${origin}${MCP_PATH}`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    /* Header only. A token in a query string ends up in an access log,
       a referrer and somebody's shell history. */
    bearer_methods_supported: ["header"],
    resource_name: "ABRAM CRM",
    resource_documentation: `${origin}/docs`,
  });
}

/** RFC 8414. Where to send somebody and where to redeem what comes back. */
export async function authorizationServerDocument(): Promise<Response> {
  const origin = await issuerOrigin();
  return doc({
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    scopes_supported: [SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    /* Public clients. Announcing "none" is not laxity, it is the accurate
       description of a server that issues no client secrets, and a client
       that reads it will stop looking for one to send. */
    token_endpoint_auth_methods_supported: ["none"],
    /* S256 and not `plain`. Advertising only the strong method is what
       stops a client offering the weak one and this server having to
       decide whether to accept it. */
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${origin}/docs`,
  });
}

/** Preflight for all four discovery addresses. */
export function discoveryPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
