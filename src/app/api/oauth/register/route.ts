import {
  CORS_HEADERS,
  isRegistrableRedirect,
  oauthError,
  oauthService,
  randomId,
} from "@/lib/mcp/oauth";

/**
 * A client introducing itself. RFC 7591.
 *
 * **Open to strangers, on purpose.** The point of dynamic registration is
 * that a client which has never seen this server can still connect to it,
 * so requiring a pre-shared identifier would mean nobody could ever add
 * the connector -- which is exactly the state this whole change exists to
 * fix. What a registration buys is the right to send somebody to a
 * consent page. It reads nothing, it grants nothing, and no row of the
 * CRM moves any closer.
 *
 * Between a client id and a single record stand three things, all of them
 * older than this file: a console password, an active `admin_users` row,
 * and a person reading whose data is about to be handed over and clicking
 * Allow.
 *
 * **No client secret is issued.** Every client here is public and proves
 * itself with PKCE instead. A secret handed to a desktop app or a
 * third-party service is a secret in a file on a machine nobody here
 * administers, and it would add no security this flow does not already
 * have.
 *
 * What is checked is small and worth checking: the redirect addresses are
 * https (or loopback), there are at most five of them, and the name fits
 * on a consent screen. The redirect list is the one field that matters,
 * because at the end of the flow it decides where an authorization code
 * is allowed to land.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_NAME = 120;
const MAX_REDIRECTS = 5;

interface RegistrationBody {
  client_name?: unknown;
  redirect_uris?: unknown;
  software_id?: unknown;
  token_endpoint_auth_method?: unknown;
  grant_types?: unknown;
  response_types?: unknown;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let body: RegistrationBody;
  try {
    body = (await request.json()) as RegistrationBody;
  } catch {
    return oauthError("invalid_client_metadata", "The registration body was not JSON.");
  }

  const rawRedirects = Array.isArray(body?.redirect_uris) ? body.redirect_uris : [];
  const redirectUris = rawRedirects
    .filter((uri): uri is string => typeof uri === "string")
    .map((uri) => uri.trim())
    .filter(Boolean);

  if (redirectUris.length === 0) {
    return oauthError("invalid_redirect_uri", "At least one redirect_uri is required.");
  }
  if (redirectUris.length > MAX_REDIRECTS) {
    return oauthError("invalid_redirect_uri", `At most ${MAX_REDIRECTS} redirect addresses.`);
  }

  const bad = redirectUris.find((uri) => !isRegistrableRedirect(uri));
  if (bad) {
    return oauthError(
      "invalid_redirect_uri",
      `${bad} is not usable. Redirect addresses must be https, or http on loopback, and carry no fragment.`
    );
  }

  /* A client that says it will send a secret has misread the metadata,
     which advertises "none". Refusing here rather than at the token
     endpoint means it finds out during setup instead of at the end of
     somebody's first sign-in. */
  const authMethod = typeof body?.token_endpoint_auth_method === "string" ? body.token_endpoint_auth_method : "none";
  if (authMethod !== "none") {
    return oauthError(
      "invalid_client_metadata",
      "This server issues no client secrets. Register with token_endpoint_auth_method of none and use PKCE."
    );
  }

  const name =
    typeof body?.client_name === "string" && body.client_name.trim()
      ? body.client_name.trim().slice(0, MAX_NAME)
      : "An unnamed client";

  const softwareId = typeof body?.software_id === "string" ? body.software_id.trim().slice(0, 120) : null;

  const service = oauthService();
  if (!service) {
    return oauthError("server_error", "This server is not configured to register clients yet.", 503);
  }

  /* Random rather than sequential. It travels in a query string, and a
     guessable one invites somebody to start a flow naming a client they
     never registered. It still authorises nothing either way. */
  const clientId = `abram_cl_${randomId(18)}`;

  const { error } = await service.from("oauth_clients").insert({
    client_id: clientId,
    client_name: name,
    redirect_uris: redirectUris,
    software_id: softwareId,
  });

  if (error) {
    console.error("OAuth client registration failed:", error);
    return oauthError("server_error", "That registration could not be saved.", 500);
  }

  /* 201 with the metadata echoed back, which is what RFC 7591 asks for.
     No secret and no expiry on the id: it names a client forever and
     grants nothing at any point. */
  return new Response(
    JSON.stringify({
      client_id: clientId,
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      client_id_issued_at: Math.floor(Date.now() / 1000),
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS },
    }
  );
}
