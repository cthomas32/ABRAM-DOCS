-- ---------------------------------------------------------------------
-- Connecting Claude to the CRM, one person at a time.
--
-- A teammate adds one URL to Claude and signs in with the login they
-- already have here. What they can ask for is exactly what they can
-- already see in the console, because the server answers every query with
-- their own database session rather than with the service role. That is
-- the whole design, and it follows the rule the rest of this system is
-- built on: access is a database fact rather than an interface one.
--
-- The token is the only new thing. It names a person to the server; it
-- grants nothing by itself.
--
-- What is stored is a SHA-256 of the token and never the token. A
-- database backup, a leaked query log or a screenshot of this table hands
-- somebody a hash, and the same rule that applies to a password applies
-- here: if the table can be read back into a working credential, the
-- table is the credential.
--
-- `prefix` is the first few visible characters, kept in the clear so the
-- console can show a person which of their tokens is which. Eight
-- characters of a 32 byte secret identifies a row and guesses nothing.
--
-- Two clocks, both enforced on every call rather than by a sweep:
--
--   expires_at   every token dies. A token with no end date is a key
--                somebody left in a drawer four laptops ago.
--   revoked_at   set the moment somebody says so, and read before the
--                token is accepted, so revoking is immediate rather than
--                eventual.
--
-- Deactivating a login kills every token on it without touching this
-- table, because the server reads `admin_users.is_active` in the same
-- lookup. One switch, one place, which is the point.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mcp_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.admin_users (user_id) ON DELETE CASCADE,

    /* Hex SHA-256 of the token. Never the token. */
    token_hash   TEXT NOT NULL UNIQUE,
    /* The visible head, so a person can tell two of their own apart. */
    prefix       TEXT NOT NULL,
    /* What they called it. "Laptop", "the work machine". */
    name         TEXT NOT NULL,

    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at   TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT mcp_tokens_name_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 80)
);

COMMENT ON TABLE public.mcp_tokens IS
    'Personal access tokens for the MCP server at /api/mcp. Stores a SHA-256 of each token and never the token. A token names a person; row level security decides what that person may read.';

COMMENT ON COLUMN public.mcp_tokens.token_hash IS
    'Hex SHA-256. If this table could be read back into a working credential it would be the credential.';

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user
    ON public.mcp_tokens (user_id, created_at DESC);

/* The hot path: hash in, live row out. Partial, because a revoked token
   is looked up once and then never again. */
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_live
    ON public.mcp_tokens (token_hash) WHERE revoked_at IS NULL;

/* ------------------------------------------------------------------ */
/*  Access                                                             */
/* ------------------------------------------------------------------ */

ALTER TABLE public.mcp_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "People read their own tokens"   ON public.mcp_tokens;
DROP POLICY IF EXISTS "People revoke their own tokens" ON public.mcp_tokens;
DROP POLICY IF EXISTS "Owners read every token"        ON public.mcp_tokens;
DROP POLICY IF EXISTS "Owners revoke any token"        ON public.mcp_tokens;

/* Your own tokens, and an owner sees everybody's. An owner needs to be
   able to answer "who has a key to this" without asking each person. */
CREATE POLICY "People read their own tokens"
    ON public.mcp_tokens FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin());

/* Revoking is an update that sets `revoked_at`. There is deliberately no
   INSERT policy: a token is minted by the server action, which holds the
   only copy of the plaintext for the one moment it is shown, and letting
   a browser insert a row here would let it choose its own hash. */
CREATE POLICY "People revoke their own tokens"
    ON public.mcp_tokens FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_owner_or_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_owner_or_admin());

/* Nothing deletes. A revoked token is evidence that a key existed. */
