/**
 * The MCP token, tested.
 *
 * Here for the same reason the attribution tests are: this is code where
 * being wrong is expensive and silent. A token that is guessable, or a
 * comparison that leaks its answer a byte at a time, fails in a way no
 * page will ever show you.
 *
 * What is deliberately not tested here is the session exchange itself.
 * `identify` talks to Supabase, and a test that mocks the auth service
 * proves that the mock behaves, which is the thing that was never in
 * doubt. That path is checked by connecting a real client with a real
 * token, which is written up in .agents/crm-mcp.md.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { bearerFrom, hashToken, mintToken, sameToken } from "../src/lib/mcp/session.ts";

test("a minted token carries the prefix that identifies this server", () => {
  const { token } = mintToken();
  assert.ok(token.startsWith("abram_mcp_"), token);
});

test("a minted token has at least 32 bytes of randomness behind the prefix", () => {
  const { token } = mintToken();
  const secret = token.slice("abram_mcp_".length);
  // base64url of 32 bytes is 43 characters with no padding.
  assert.equal(secret.length, 43);
});

test("two tokens minted in the same millisecond are different", () => {
  const first = mintToken();
  const second = mintToken();
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.hash, second.hash);
});

test("the prefix is short enough to identify a row and not to guess one", () => {
  const { token, prefix } = mintToken();
  assert.equal(prefix.length, 8);
  assert.ok(token.includes(prefix));
  // The visible head must not be the whole secret.
  assert.ok(prefix.length < token.slice("abram_mcp_".length).length);
});

test("hashing is stable, and a different token hashes differently", () => {
  const { token, hash } = mintToken();
  assert.equal(hashToken(token), hash);
  assert.equal(hash.length, 64, "hex sha-256");
  assert.notEqual(hashToken(token + "x"), hash);
});

test("the hash cannot be read back into the token", () => {
  const { token, hash } = mintToken();
  assert.ok(!hash.includes(token.slice("abram_mcp_".length)));
});

test("comparing hashes is exact", () => {
  const a = mintToken();
  const b = mintToken();
  assert.ok(sameToken(a.hash, a.hash));
  assert.ok(!sameToken(a.hash, b.hash));
});

test("comparing different lengths is false rather than a throw", () => {
  // timingSafeEqual throws on a length mismatch, which would turn a
  // malformed token into a 500 instead of a refusal.
  assert.doesNotThrow(() => sameToken("short", "considerably-longer"));
  assert.ok(!sameToken("short", "considerably-longer"));
});

/* ------------------------------------------------------------------ */
/*  Reading the header                                                 */
/* ------------------------------------------------------------------ */

function requestWith(header: string | null): Request {
  return new Request("https://abram.network/api/mcp", {
    method: "POST",
    headers: header ? { authorization: header } : {},
  });
}

test("a bearer token is read out of the header", () => {
  const { token } = mintToken();
  assert.equal(bearerFrom(requestWith(`Bearer ${token}`)), token);
});

test("the scheme is matched without regard to case, as the specification says", () => {
  const { token } = mintToken();
  assert.equal(bearerFrom(requestWith(`bearer ${token}`)), token);
  assert.equal(bearerFrom(requestWith(`BEARER ${token}`)), token);
});

test("no header, the wrong scheme, or somebody else's token shape is refused", () => {
  const { token } = mintToken();
  assert.equal(bearerFrom(requestWith(null)), null);
  assert.equal(bearerFrom(requestWith("")), null);
  assert.equal(bearerFrom(requestWith(`Basic ${token}`)), null);
  // A well formed bearer token that is not ours. Refusing it here means
  // a pasted token from another service never reaches the database.
  assert.equal(bearerFrom(requestWith("Bearer sk-live-not-ours")), null);
});

test("surrounding whitespace does not change the token", () => {
  const { token } = mintToken();
  assert.equal(bearerFrom(requestWith(`  Bearer   ${token}  `)), token);
});
