# The CRM over MCP, and the brain behind it

How a teammate asks Claude about the CRM and gets an answer scoped to their own access, and where the words it quotes back come from.

`growth-crm.md` covers who may see what. This covers how that same rule reaches a chat window without being written down a second time.

## The one idea

**The server never answers with the service role.** It authenticates a token, opens a real database session belonging to that person, and runs every query with it. Row level security then decides what comes back, exactly as it does for the console.

That is four lines longer than the obvious version, which is: look the token up, query with the elevated key, filter the rows in JavaScript according to `permissions.ts`. Do not do that. It is how a system ends up with two definitions of who may see what, and the copy that drifts is always the one doing the enforcing. The symptom is not an error, it is a growth advisor reading somebody else's pipeline in a chat window six months after everybody stopped thinking about it.

So: an advisor asking Claude for "my accounts" gets their own accounts for the same reason the accounts screen shows them their own accounts. There is no configuration anywhere that widens the connection without widening their console access first.

## How a session is obtained

This project cannot mint a database token. The keys are asymmetric and the private half lives in the auth service.

What it can do, holding the service role, is ask the auth service for a one time link for a known address and immediately redeem it:

1. `auth.admin.generateLink({ type: 'magiclink', email })` — **generates, does not send.** No mail leaves. It returns the token a link would have carried.
2. `auth.verifyOtp({ token_hash, type: 'magiclink' })` — redeems it for an ordinary user session.
3. That access token goes in an `Authorization` header on a client built with the publishable key.

The address comes from `admin_users` and never from the request, so a caller chooses a token and never an identity. The session is cached in memory for fifty minutes against an access token that lives an hour, which turns a two round trip exchange into a per hour cost rather than a per request one.

**The cache never shortcuts a check.** Token existence, revocation, expiry and `admin_users.is_active` are all read on every single request, cached session or not. Deactivating somebody in the console ends their Claude access on their next call without anybody remembering this table exists.

If `generateLink` ever turns out to be rate limited in practice, the fallback is to capture and encrypt a refresh token during a one time "connect" click in the console. Recorded here so it is a decision rather than a scramble.

## Tokens

`mcp_tokens` stores a **SHA-256 of the token and never the token**. The plaintext exists in exactly one place for exactly one moment: the return value of `createMcpToken`. It is shown once and no path in this application can produce it again.

- `prefix` — the first eight characters, in the clear, so a person can tell two of their own apart. It identifies a row and guesses nothing.
- `expires_at` — every token dies. 180 days by default, one year maximum. A token with no end date is a key somebody left in a drawer four laptops ago.
- `revoked_at` — read before the token is accepted, so revoking is immediate rather than eventual. Revoking also drops the cached session on the warm instance.
- Ten live tokens per person. The failure this prevents is not somebody making eleven on purpose, it is a broken client retrying a setup step and leaving forty live keys behind.

**There is no INSERT policy on `mcp_tokens`.** Minting goes through the service role inside a server action that has already established who is asking, because a browser that can insert a row here can choose its own hash, which is the same as choosing its own token for somebody else's account. Revoking is an ordinary policy-governed update.

Nothing deletes. A revoked token is evidence that a key existed.

## The transport

`POST /api/mcp`, and it is **written by hand rather than with the SDK**.

What Claude needs from an HTTP MCP server is a small, fully specified subset: `initialize`, `tools/list`, `tools/call`, `ping`, and ignoring notifications. That is the whole of `src/app/api/mcp/route.ts`. The alternative is a dependency whose protocol version has to be kept in step with a client nobody here controls, in a repository with fifteen dependencies in total. **If this ever needs resources, prompts or sampling, take the SDK then and delete the hand rolled version.** Those are the parts worth not writing twice.

Stateless: no `Mcp-Session-Id`, no SSE, no resumability. A serverless function that pretends to hold a long lived stream is a function that drops it at the first scale to zero.

Two deliberate choices in the error handling:

- **`initialize` answers before the token is checked.** A client that cannot finish a handshake reports "server unreachable", which sends somebody to look at DNS. Letting it finish means the first tool call returns a sentence about a missing token, which sends them to the right place.
- **A tool refusal is an answer, not a transport error.** It comes back as text with `isError` set, so the model says "your login cannot read that" instead of retrying four times.

`/api/mcp` is excluded from the middleware matcher. It authenticates with a bearer token and opens its own session, so a cookie refresh would add a round trip and do nothing.

## The tools

Read: `search_people`, `get_person`, `search_companies`, `get_company`, `search_deals`, `get_deal`, `list_activities`, `pipeline_summary`, `search_brain`, `get_brain_doc`.

Write: `log_activity`, `create_task`, `update_deal_stage`.

Three rules govern the set:

**The permission on each tool is politeness. Postgres is the lock.** Queries run as the person, so the database decides what comes back whatever `tools.ts` believes. The permission exists so a refusal reads as a closed door rather than as an empty list. If the two disagree, the database is right and the file is a bug.

**Nothing can close a deal, delete, or archive.** Winning a deal locks its attribution rule and starts a commission clock, so it stays in the console where it asks for a date and says it cannot be undone. A conversation that can archive a person by misunderstanding a sentence is not a conversation worth having.

**An empty answer says why it might be empty.** When the reader is scoped, "no results" is the wrong answer if the real reason is that the record belongs to somebody else, because the next thing that happens is they create it again.

Every write records `author_user_id`, so the timeline shows who did it.

## The brain

`brain_docs` is what `search_brain` and `get_brain_doc` read, and the console edits it at `/admin/dashboard/content?tab=brain`. Five collections mirroring `abram-network/.agents/brain/`: `brand`, `business`, `market`, `decisions`, `proposals`.

**This trades review for reach, and that is the whole difference from the file version.** Over there a knowledge change rides a pull request and Connor's Approve click is what promotes "an agent thinks this" into "the company believes this". Here there is no propose-a-change path, so **write is owner and admin only** and read is everybody who can enter the console. Widening the write side would quietly lose the one property worth keeping.

`brain_doc_revisions` buys the history back. A trigger files the superseded version before every update that changes the words, so "what did this say last month" and "who changed it" both have answers. The trigger is SECURITY DEFINER and there is no write policy on the revisions table: a history somebody can edit is not a history.

Two conventions carried over from the files, and both matter more than they look:

- **`last_verified_on`.** Everything decays. Past ninety days the shelf draws it in amber and `get_brain_doc` says so in its first line, because the failure mode of a knowledge base is not that it is empty, it is that it is confidently out of date.
- **Verifying is its own action.** "Still true" says *I read this and it holds*, which is a different claim from *I fixed a typo*. A stamp that moved on every save would say nothing.

The reader renders Markdown without a compiler (`src/components/admin/Markdown.tsx`). MDX would compile at render time and a half typed `<` in a draft would throw inside a server component, which is a blank screen. A document store whose reader crashes on a draft is a document store nobody drafts in.

## Signing in, rather than pasting a token

There are two ways in, and the second one is the fallback.

**Signing in.** Add `https://abram.network/api/mcp` in Claude, leave the client ID and secret boxes empty, click connect. It sends you to `/authorize`, you sign in to the console if you are not already, you read who is about to get access and click Allow. No token is shown and nothing is pasted.

**A token.** Console: **Team → Claude access**. Name one, copy it once, send it as `Authorization: Bearer <token>`.

The reason both exist is a limitation on the other side. **The claude.ai connector dialog has a URL box and no header box** — it takes OAuth and nothing else — so on the web, on desktop and on a phone, a token is not merely inconvenient, it is impossible. Claude Code does let you set a header, and so does anything talking to the endpoint directly, and neither has a browser to send somebody to.

### What went wrong before this existed, because it will look familiar

Adding the server to claude.ai landed on a blank page at `https://abram.network/authorize?...&client_id=Connor&...`. Nothing was broken. `/api/mcp` answered a request with no token exactly as designed, with `401` and `WWW-Authenticate: Bearer realm="abram-crm"` — and **that header named no discovery document**. A client told to use a bearer token and nothing about where to get one falls back to guessing the OAuth endpoint names at the origin, so it guessed `/authorize`, which was a 404. The `client_id=Connor` was a person typing their name into a box the app fills in for itself.

The lesson is worth keeping: **a 401 that does not name its `resource_metadata` sends people to a blank page rather than to a sign-in.** The header now carries it.

## The authorization server

Five addresses, and the last act of all of them is a row in `mcp_tokens`.

| Address | What it is |
|---|---|
| `/.well-known/oauth-protected-resource/api/mcp` | RFC 9728. What this resource is and who vouches for callers |
| `/.well-known/oauth-authorization-server` | RFC 8414. Where the three endpoints are |
| `/api/oauth/register` | RFC 7591. A client introducing itself |
| `/authorize` | The consent screen |
| `/api/oauth/token` | A code, spent once, for a token |

Both discovery documents are also served at the other of the two addresses clients probe, because answering costs four lines and a 404 sends a client back to guessing.

**It issues no new kind of credential.** The end of the flow is an insert into the same `mcp_tokens` table the team screen writes to, with `oauth_client_id` filled in. `/api/mcp` and `session.ts` are untouched and cannot tell the two apart. That is the point: an OAuth layer is the most likely place for a second definition of who may see what to appear, and there is not one. Row level security still decides every answer.

Four things hold it up:

- **Public clients, PKCE, S256 only.** No client secrets are issued anywhere. A secret handed to a desktop app is a secret in a file on a machine nobody here administers, and PKCE replaces it with a proof. `plain` is refused; it exists for devices that cannot hash and is a downgrade attack everywhere else.
- **Registration is open, and that is not the hole it looks like.** Dynamic registration has to accept strangers, or a connector that has never seen this server could never connect — which was the entire original failure. A client id buys the right to send somebody to a consent page. Between that page and one row of the CRM stand a console password, an active `admin_users` row, and a person clicking Allow.
- **The redirect address is matched whole, against a list registered before the flow began.** Never by prefix: a prefix test on `https://claude.ai/` also passes `https://claude.ai.evil.test/`. This one comparison is what stands between an authorization code and somebody else's server, and it is the reason an unknown client gets a message on the page and *no redirect at all*, while a registered client sending a malformed request gets redirected back with an error.
- **A code presented twice revokes what the first presentation bought.** Two uses of a single-use code means somebody else has seen it. A client retrying loses its connection and reconnects, which is the cheaper of the two mistakes.

Re-authorizing the same client revokes its previous token rather than stacking a second one, so reconnecting four times does not leave four live keys walking towards the ten-token cap.

**The consent screen never reads an identity from the request.** It comes from the session cookie. A form field naming the person to authorize would let anybody mint a token for anybody, and that is the failure the whole file is arranged around.

**`oauth_codes` has RLS on and no policy at all, deliberately.** It will appear in result 2 of `scripts/audit-open-policies.sql` as a table nobody can read. That is correct: it is written and read only by route handlers holding the service role, on the same reasoning that keeps an INSERT policy off `mcp_tokens`. Whoever can choose the hash can choose the credential.

## Checking it works

The check worth running after any change here, because it is the one thing the type checker cannot see:

0. **Connect from claude.ai** with the client ID and secret boxes empty. Expect a consent screen, not a blank page, and a working connection afterwards.
1. Sign in as an **owner**, ask for the pipeline. Expect every deal.
2. Sign in as a **growth advisor**, ask the same thing. Expect their own accounts, and `pipeline_summary` to refuse in words.
3. Sign in as a **contributor**, ask for anybody. Expect `tools/list` to carry the brain tools and no CRM tools at all.
4. **Revoke** a token, call again. Expect a 401 on the next request, not on the one after.

If step 2 returns everything, stop and read `session.ts` before shipping: it means something reached for the service role.

### What has actually been run, 2026-08-18

Against the live project, with a real token minted for the owner and revoked afterwards:

| Check | Result |
|---|---|
| No token | `401` with `WWW-Authenticate: Bearer realm="abram-crm"` |
| `initialize` | Answers before the token is checked, as designed |
| **The session exchange** | **Works.** `generateLink` plus `verifyOtp` returned a real user session, no mail sent, no rate limiting seen |
| `tools/list` as owner | All thirteen tools |
| `search_people` | Returned real rows through the user client |
| `log_activity` | Wrote, and the row carries `author_user_id` |
| `update_deal_stage` to `won` | Refused in a sentence, `isError` false, not a transport error |
| Revoke, then call again | `401` on the very next request |

**Steps 2 and 3 could not be run and remain unrun.** `admin_users` holds exactly one row, the owner, so there is no growth advisor and no contributor to sign in as. The scoping they test is enforced by row level security rather than by anything in this folder, and the policies are exercised by the console, but *this transport* has only ever been exercised as an owner. **Run steps 2 and 3 the day a second teammate is onboarded, before giving them a token.** That is the moment the check stops being theoretical.

The fallback for a rate limited `generateLink` is written up above and was not needed.

## Where the code is

| Path | What it holds |
|---|---|
| `src/lib/mcp/session.ts` | Tokens, the session exchange, the cache, every refusal |
| `src/lib/mcp/tools.ts` | The tool registry and every answer's wording |
| `src/app/api/mcp/route.ts` | The JSON-RPC subset, and the 401 that names the discovery document |
| `src/lib/mcp/oauth.ts` | PKCE, redirect matching, the resource check. No Next imports, so it is testable |
| `src/lib/mcp/origin.ts` | The issuer, read from the request so previews authorize against themselves |
| `src/lib/mcp/metadata.ts` | The two discovery documents |
| `src/app/.well-known/` | Four routes serving those two documents |
| `src/app/api/oauth/register/` | Dynamic client registration |
| `src/app/api/oauth/token/` | Code for token, PKCE verified here |
| `src/app/authorize/` | The consent screen and its two buttons |
| `src/app/admin/dashboard/team/mcpActions.ts` | Minting and revoking |
| `src/lib/brain/collections.ts` | The five shelves, and the ninety day rule |
| `src/app/admin/dashboard/brain/` | The shelf, the reader, the editor |
| `supabase/migrations/20260818150000_brain_docs.sql` | Brain schema, revisions trigger, policies |
| `supabase/migrations/20260818160000_mcp_tokens.sql` | Token schema and policies |
| `supabase/migrations/20260819170000_mcp_oauth.sql` | Clients, codes, and `mcp_tokens.oauth_client_id` |
| `tests/mcp-tokens.test.mts` | Minting, hashing, and reading the header |
| `tests/mcp-oauth.test.mts` | Redirect matching, PKCE, and the resource check |
