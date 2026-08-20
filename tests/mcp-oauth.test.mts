/**
 * The OAuth flow, tested where being wrong is silent.
 *
 * Three of these functions decide whether a stranger can walk off with a
 * key to the CRM, and none of them has a screen that would show you they
 * were wrong. A redirect matcher that accepts one address too many sends
 * an authorization code to somebody else's server and every page in the
 * console still looks fine.
 *
 * What is not tested here is the endpoints themselves. They talk to
 * Supabase, and a test that mocks the database proves the mock behaves.
 * That path is checked by connecting a real client, which is written up
 * in .agents/crm-mcp.md.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";

import {
  isRegistrableRedirect,
  pkceChallengeFor,
  randomId,
  redirectIsRegistered,
  resourceMatches,
  sameSecret,
  sha256Hex,
} from "../src/lib/mcp/oauth.ts";

/* ------------------------------------------------------------------ */
/*  Where a code is allowed to land                                    */
/* ------------------------------------------------------------------ */

test("an address that was registered is accepted", () => {
  const registered = ["https://claude.ai/api/mcp/auth_callback"];
  assert.equal(redirectIsRegistered(registered, "https://claude.ai/api/mcp/auth_callback"), true);
});

test("a lookalike host that merely starts with a registered one is refused", () => {
  // The failure a prefix comparison would let through, and the reason
  // this matcher compares whole strings.
  const registered = ["https://claude.ai/api/mcp/auth_callback"];
  assert.equal(
    redirectIsRegistered(registered, "https://claude.ai.evil.test/api/mcp/auth_callback"),
    false
  );
});

test("a different path on a registered host is refused", () => {
  const registered = ["https://claude.ai/api/mcp/auth_callback"];
  assert.equal(redirectIsRegistered(registered, "https://claude.ai/somewhere/else"), false);
});

test("an extra query parameter makes it a different address", () => {
  const registered = ["https://claude.ai/api/mcp/auth_callback"];
  assert.equal(
    redirectIsRegistered(registered, "https://claude.ai/api/mcp/auth_callback?x=1"),
    false
  );
});

test("nothing matches an empty registration list", () => {
  assert.equal(redirectIsRegistered([], "https://claude.ai/api/mcp/auth_callback"), false);
});

/* ------------------------------------------------------------------ */
/*  What may be registered in the first place                          */
/* ------------------------------------------------------------------ */

test("https is registrable", () => {
  assert.equal(isRegistrableRedirect("https://claude.ai/api/mcp/auth_callback"), true);
});

test("plain http on loopback is registrable, because a native client has no certificate", () => {
  assert.equal(isRegistrableRedirect("http://127.0.0.1:8976/callback"), true);
  assert.equal(isRegistrableRedirect("http://localhost:3000/callback"), true);
});

test("plain http anywhere else is refused", () => {
  assert.equal(isRegistrableRedirect("http://claude.ai/callback"), false);
});

test("a host that merely contains the word localhost is not loopback", () => {
  assert.equal(isRegistrableRedirect("http://localhost.evil.test/callback"), false);
});

test("an address with a fragment is refused", () => {
  // The fragment never reaches the server, so a client expecting one is
  // confused about which flow it is in.
  assert.equal(isRegistrableRedirect("https://claude.ai/callback#token"), false);
});

test("something that is not a URL at all is refused", () => {
  assert.equal(isRegistrableRedirect("claude.ai/callback"), false);
  assert.equal(isRegistrableRedirect(""), false);
});

/* ------------------------------------------------------------------ */
/*  PKCE                                                               */
/* ------------------------------------------------------------------ */

test("the challenge is the base64url SHA-256 of the verifier", () => {
  const verifier = randomBytes(32).toString("base64url");
  const expected = createHash("sha256").update(verifier, "utf8").digest("base64url");
  assert.equal(pkceChallengeFor(verifier), expected);
});

test("a challenge carries no base64 padding, which is what S256 specifies", () => {
  const challenge = pkceChallengeFor(randomBytes(32).toString("base64url"));
  assert.equal(challenge.includes("="), false);
  assert.equal(challenge.length, 43);
});

test("a wrong verifier does not produce the challenge", () => {
  const challenge = pkceChallengeFor("a".repeat(43));
  assert.notEqual(pkceChallengeFor("b".repeat(43)), challenge);
});

/* ------------------------------------------------------------------ */
/*  Comparisons and secrets                                            */
/* ------------------------------------------------------------------ */

test("sameSecret is true for equal strings and false for unequal ones", () => {
  assert.equal(sameSecret("abc", "abc"), true);
  assert.equal(sameSecret("abc", "abd"), false);
});

test("sameSecret does not throw on different lengths", () => {
  // timingSafeEqual throws on a length mismatch, which would turn a
  // wrong guess into a 500 and a very loud oracle.
  assert.equal(sameSecret("short", "considerably longer"), false);
});

test("an authorization code has at least 32 bytes of randomness", () => {
  const id = randomId(32);
  assert.equal(id.length, 43);
  assert.notEqual(randomId(32), id);
});

test("hashing is stable and hex", () => {
  assert.match(sha256Hex("anything"), /^[0-9a-f]{64}$/);
  assert.equal(sha256Hex("anything"), sha256Hex("anything"));
});

/* ------------------------------------------------------------------ */
/*  Which resource a token is for                                      */
/* ------------------------------------------------------------------ */

const ORIGIN = "https://abram.network";

test("the resource this server serves is accepted", () => {
  assert.equal(resourceMatches("https://abram.network/api/mcp", ORIGIN), true);
});

test("a trailing slash is the same resource", () => {
  assert.equal(resourceMatches("https://abram.network/api/mcp/", ORIGIN), true);
});

test("an absent resource is accepted, because clients predating the rule are still clients", () => {
  assert.equal(resourceMatches(null, ORIGIN), true);
});

test("another host is refused even when the path matches", () => {
  assert.equal(resourceMatches("https://evil.test/api/mcp", ORIGIN), false);
});

test("another path on this host is refused", () => {
  assert.equal(resourceMatches("https://abram.network/api/track", ORIGIN), false);
});
