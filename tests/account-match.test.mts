/**
 * Which company a person belongs to, tested.
 *
 * Here because this is the rare piece of matching logic where the wrong
 * answer is worse than no answer. A missed match leaves a person on the
 * unlinked list, which somebody fixes in a click. A false match files
 * them under another company's account, where they quietly influence a
 * commission figure nobody is re-checking.
 *
 * So most of what follows is tests that it declines: consumer mail
 * domains, ambiguous names, and near misses that a fuzzy matcher would
 * happily accept.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  employerDomain,
  isConsumerDomain,
  matchAccount,
  normalizeCompanyName,
  normalizeDomain,
  suggestAccount,
} from "../src/lib/crm/accountMatch.ts";

const ACCOUNTS = [
  { id: "helix", name: "Helix Studios", domain: "helix.com" },
  { id: "helix-post", name: "Helix Post", domain: "helixpost.com" },
  { id: "nebula", name: "Nebula Pictures Ltd", domain: null },
  { id: "spire", name: "Spire Media", domain: "WWW.Spire.co.uk" },
];

/* ------------------------------------------------------------------ */
/*  Domains                                                            */
/* ------------------------------------------------------------------ */

test("normalizeDomain takes a pasted url down to a bare host", () => {
  assert.equal(normalizeDomain("https://www.Helix.com/about?x=1"), "helix.com");
  assert.equal(normalizeDomain("helix.com."), "helix.com");
  assert.equal(normalizeDomain("  HELIX.COM  "), "helix.com");
});

test("normalizeDomain refuses what is not a host", () => {
  assert.equal(normalizeDomain("helix"), null, "no dot is not a domain");
  assert.equal(normalizeDomain("helix studios.com"), null, "a space is not a domain");
  assert.equal(normalizeDomain(""), null);
  assert.equal(normalizeDomain(null), null);
});

test("employerDomain reads the half after the last @", () => {
  assert.equal(employerDomain("alex@helix.com"), "helix.com");
  assert.equal(employerDomain("odd@name@helix.com"), "helix.com");
  assert.equal(employerDomain("Alex@Helix.COM"), "helix.com");
});

test("employerDomain refuses a mailbox provider", () => {
  for (const address of [
    "alex@gmail.com",
    "alex@googlemail.com",
    "alex@outlook.com",
    "alex@icloud.com",
    "alex@proton.me",
    "alex@qq.com",
  ]) {
    assert.equal(employerDomain(address), null, `${address} names no employer`);
  }
  assert.equal(isConsumerDomain("gmail.com"), true);
  assert.equal(isConsumerDomain("helix.com"), false);
});

test("employerDomain refuses an address that is not one", () => {
  assert.equal(employerDomain("@helix.com"), null, "no local part");
  assert.equal(employerDomain("alex"), null);
  assert.equal(employerDomain(null), null);
});

/* ------------------------------------------------------------------ */
/*  Names                                                              */
/* ------------------------------------------------------------------ */

test("normalizeCompanyName folds the ways one company gets typed", () => {
  const same = ["Helix Studios", "helix studios", "HELIX  STUDIOS", "Helix-Studios", "Helix Studios."];
  for (const written of same) {
    assert.equal(normalizeCompanyName(written), "helix studios", written);
  }
});

test("normalizeCompanyName drops one legal suffix and a leading the", () => {
  assert.equal(normalizeCompanyName("Helix Ltd"), "helix");
  assert.equal(normalizeCompanyName("Helix, Inc."), "helix");
  assert.equal(normalizeCompanyName("Nebula Pictures Ltd"), "nebula pictures");
  assert.equal(normalizeCompanyName("The Helix"), "helix");
});

test("normalizeCompanyName stops at one suffix, so Sky Co Ltd stays Sky Co", () => {
  assert.equal(normalizeCompanyName("Sky Co Ltd"), "sky co");
});

test("normalizeCompanyName keeps the word that tells two companies apart", () => {
  assert.notEqual(
    normalizeCompanyName("Helix Studios"),
    normalizeCompanyName("Helix Post"),
    "Studios and Post are the whole difference"
  );
});

test("normalizeCompanyName folds accents and spells out an ampersand", () => {
  assert.equal(normalizeCompanyName("Amélie & Co"), normalizeCompanyName("Amelie and Co"));
});

test("normalizeCompanyName returns empty for nothing usable", () => {
  assert.equal(normalizeCompanyName("   "), "");
  assert.equal(normalizeCompanyName("!!!"), "");
  assert.equal(normalizeCompanyName(null), "");
});

/* ------------------------------------------------------------------ */
/*  Matching                                                           */
/* ------------------------------------------------------------------ */

test("the email domain wins, and says so", () => {
  const hit = matchAccount({ company: "somewhere else", email: "alex@helix.com" }, ACCOUNTS);
  assert.equal(hit?.account.id, "helix");
  assert.equal(hit?.matchedOn, "domain");
});

test("a stored domain is compared normalised, not raw", () => {
  const hit = matchAccount({ company: null, email: "sam@spire.co.uk" }, ACCOUNTS);
  assert.equal(hit?.account.id, "spire", "WWW.Spire.co.uk must still match spire.co.uk");
});

test("the company name matches when the domain says nothing", () => {
  const hit = matchAccount({ company: "Nebula Pictures", email: "sam@gmail.com" }, ACCOUNTS);
  assert.equal(hit?.account.id, "nebula");
  assert.equal(hit?.matchedOn, "name");
});

test("a website stands in for an address that names no employer", () => {
  const hit = matchAccount(
    { company: null, email: "sam@gmail.com", website: "https://helixpost.com" },
    ACCOUNTS
  );
  assert.equal(hit?.account.id, "helix-post");
});

test("a consumer address never reaches the domain pass", () => {
  // gmail.com is in nobody's account list, but the point is that it is
  // refused before the lookup rather than by failing to find one.
  assert.equal(employerDomain("alex@gmail.com"), null);
  const hit = matchAccount({ company: null, email: "alex@gmail.com" }, ACCOUNTS);
  assert.equal(hit, null);
});

test("no company text and no usable domain is no answer", () => {
  assert.equal(matchAccount({ company: null, email: null }, ACCOUNTS), null);
  assert.equal(matchAccount({ company: "   ", email: "a@gmail.com" }, ACCOUNTS), null);
});

test("a near miss is refused rather than guessed", () => {
  assert.equal(
    matchAccount({ company: "Helix", email: null }, ACCOUNTS),
    null,
    "Helix is not Helix Studios and must not be assumed to be"
  );
  assert.equal(matchAccount({ company: "Phoenix", email: null }, ACCOUNTS), null);
});

test("an ambiguous name is refused rather than resolved alphabetically", () => {
  const twins = [
    { id: "a", name: "Vesper", domain: null },
    { id: "b", name: "Vesper Ltd", domain: null },
  ];
  assert.equal(
    matchAccount({ company: "Vesper", email: null }, twins),
    null,
    "both normalise to vesper, so the answer is genuinely unknown"
  );
});

test("matching an empty account list is not an error", () => {
  assert.equal(matchAccount({ company: "Helix Studios", email: "a@helix.com" }, []), null);
});

/* ------------------------------------------------------------------ */
/*  Suggesting                                                         */
/* ------------------------------------------------------------------ */

test("the suggestion keeps what was typed and fills the domain from the address", () => {
  assert.deepEqual(suggestAccount({ company: "  Helix Studios  ", email: "alex@helix.com" }), {
    name: "Helix Studios",
    domain: "helix.com",
  });
});

test("the suggestion leaves the domain null when the address names no employer", () => {
  assert.deepEqual(suggestAccount({ company: "Helix Studios", email: "alex@gmail.com" }), {
    name: "Helix Studios",
    domain: null,
  });
});

test("there is nothing to suggest without company text", () => {
  assert.equal(suggestAccount({ company: null, email: "alex@helix.com" }), null);
  assert.equal(suggestAccount({ company: "  ", email: "alex@helix.com" }), null);
});
