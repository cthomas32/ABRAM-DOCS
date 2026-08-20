-- ---------------------------------------------------------------------
-- Connecting Claude without pasting anything.
--
-- `mcp_tokens` already does the whole job: a token names a person, and
-- row level security decides what that person may read. What it cannot do
-- is get itself into claude.ai, because that connector dialog has no
-- field for a header. It has an OAuth flow and nothing else.
--
-- So this adds the smallest authorization server that flow will accept,
-- and it deliberately does not invent a second kind of credential. The
-- end of the OAuth dance is an ordinary row in `mcp_tokens` with
-- `oauth_client_id` filled in. `/api/mcp` is unchanged, `identify()` is
-- unchanged, and every access rule stays exactly where it was: in
-- Postgres. Two tables here, both of them scaffolding around the one that
-- already existed.
--
-- **Registration grants nothing.** Anybody on the internet can POST to
-- the registration endpoint and get a client id, because dynamic client
-- registration is how a connector that has never seen this server before
-- introduces itself, and requiring a pre-shared id would mean nobody
-- could ever connect. A client id is a name, not a key. Between it and a
-- single row of the CRM stand: signing in to the console with a real
-- password, having an active `admin_users` row, and clicking Allow on a
-- page that says whose data it is about to hand over.
--
-- **Public clients only.** No client secrets, anywhere. A secret shipped
-- to a desktop app or held by a third party is a secret in a text file on
-- somebody else's laptop, and PKCE removes the need for it: the client
-- proves it is the same one that started the flow by producing the
-- preimage of a hash it committed to up front. S256 only. `plain` is in
-- the specification for devices that cannot hash and is a downgrade
-- attack everywhere else.
-- ---------------------------------------------------------------------

/* ------------------------------------------------------------------ */
/*  Who is asking                                                      */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.oauth_clients (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    /* Public, and handed back to the client that registered. Random
       rather than sequential: it appears in a query string and a guessable
       one invites somebody to start a flow naming a client they never
       registered. It still authorises nothing. */
    client_id          TEXT NOT NULL UNIQUE,

    /* What it called itself. Shown to the person on the consent screen,
       so it is displayed as untrusted text and never as markup. */
    client_name        TEXT NOT NULL,

    /* Exact-match allow list. A code is only ever redirected to an
       address that was registered before the flow began; that is the one
       thing standing between a stolen authorization code and somebody
       else's inbox. Compared whole, never by prefix: a prefix test on
       "https://claude.ai/" also passes "https://claude.ai.evil.test/". */
    redirect_uris      TEXT[] NOT NULL,

    software_id        TEXT,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    last_authorized_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT oauth_clients_name_check      CHECK (char_length(btrim(client_name)) BETWEEN 1 AND 120),
    CONSTRAINT oauth_clients_redirects_check CHECK (
        array_length(redirect_uris, 1) BETWEEN 1 AND 5
    )
);

COMMENT ON TABLE public.oauth_clients IS
    'Clients that have introduced themselves via dynamic client registration. A row here grants nothing: it is a name and a redirect allow list. Access requires a console login and a person clicking Allow.';

CREATE INDEX IF NOT EXISTS idx_oauth_clients_created
    ON public.oauth_clients (created_at DESC);

/* ------------------------------------------------------------------ */
/*  The ten seconds between Allow and a token                          */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.oauth_codes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    /* Hex SHA-256 of the code, on the same reasoning as `mcp_tokens`: a
       code is a bearer credential for as long as it lives, and a table
       that can be read back into a working credential is the credential.
       Its life is measured in seconds, which lowers the stakes and does
       not change the rule. */
    code_hash           TEXT NOT NULL UNIQUE,

    client_id           TEXT NOT NULL REFERENCES public.oauth_clients (client_id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,

    /* Recorded at issue and compared at redemption. RFC 6749 asks for
       this and the reason is not bookkeeping: without it, a client that
       registered two redirect addresses can have a code issued to one and
       redeemed against the other. */
    redirect_uri        TEXT NOT NULL,

    /* The PKCE commitment. S256 only, enforced here rather than trusted
       from the request. */
    code_challenge      TEXT NOT NULL,

    /* RFC 8707. Which resource the token is being asked for, so a token
       minted for this CRM cannot be replayed at some future second
       server on the same issuer. */
    resource            TEXT,

    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    redeemed_at         TIMESTAMP WITH TIME ZONE,

    /* What redemption produced. Kept so that a second presentation of an
       already-spent code can revoke the token the first one bought, which
       is the specified response to a code that has plainly been stolen. */
    issued_token_id     UUID REFERENCES public.mcp_tokens (id) ON DELETE SET NULL,

    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT oauth_codes_challenge_check CHECK (char_length(code_challenge) BETWEEN 43 AND 128)
);

COMMENT ON TABLE public.oauth_codes IS
    'Authorization codes, hashed, single use, alive for minutes. issued_token_id exists so that replaying a spent code revokes what the first redemption produced.';

CREATE INDEX IF NOT EXISTS idx_oauth_codes_expiry
    ON public.oauth_codes (expires_at);

/* ------------------------------------------------------------------ */
/*  Marking a token as something a person clicked Allow for            */
/* ------------------------------------------------------------------ */

/* Null for a token somebody made by hand on the team screen, set for one
   the OAuth flow produced. It earns its place by making re-consent
   idempotent: connecting the same client twice replaces the first token
   instead of leaving a dead one behind and walking one step closer to the
   ten-live-tokens cap. */
ALTER TABLE public.mcp_tokens
    ADD COLUMN IF NOT EXISTS oauth_client_id TEXT
        REFERENCES public.oauth_clients (client_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.mcp_tokens.oauth_client_id IS
    'Set when this token came from the OAuth flow rather than the team screen. Re-authorizing the same client revokes the previous one.';

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_oauth
    ON public.mcp_tokens (user_id, oauth_client_id) WHERE oauth_client_id IS NOT NULL;

/* ------------------------------------------------------------------ */
/*  Access                                                             */
/* ------------------------------------------------------------------ */

ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_codes   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read registered clients" ON public.oauth_clients;

/* Read only, owners and admins only, and no policy at all on the codes
   table. Both are written exclusively by the service role from route
   handlers that have already established who is asking, on the same
   reasoning that keeps an INSERT policy off `mcp_tokens`: a browser that
   can write a row here can choose the hash, and choosing the hash is
   choosing the credential.

   The clients table is readable because "which connectors exist" is a
   question an owner should be able to answer. The codes table is not
   readable by anybody, because there is no version of that question worth
   answering and the rows are gone in minutes. */
CREATE POLICY "Owners read registered clients"
    ON public.oauth_clients FOR SELECT TO authenticated
    USING (public.is_owner_or_admin());

/* ------------------------------------------------------------------ */
/*  Sweeping up                                                        */
/* ------------------------------------------------------------------ */

/* Expired codes are harmless -- redemption checks the clock and never the
   presence of the row -- but a table that only grows is a table somebody
   discovers with a million rows in it. Called opportunistically from the
   token endpoint rather than scheduled, because the natural moment to
   clear up after a flow is at the end of the next one.

   SECURITY DEFINER so it can delete under RLS, and pinned to a fixed
   search_path so it cannot be pointed at a shadowed table. */
CREATE OR REPLACE FUNCTION public.prune_oauth_codes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.oauth_codes
    WHERE expires_at < timezone('utc'::text, now()) - INTERVAL '1 day';
$$;

REVOKE ALL ON FUNCTION public.prune_oauth_codes() FROM PUBLIC;

COMMENT ON FUNCTION public.prune_oauth_codes() IS
    'Deletes authorization codes a day past expiry. Redemption never depends on a row being present, so this is housekeeping and not enforcement.';
