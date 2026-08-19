/**
 * The lock on /demos, tested.
 *
 * Two things here can fail silently. A comparison that accepts something
 * it should not opens the library to anybody, and a return path that
 * accepts an absolute url turns the unlock form into an open redirect
 * somebody can point at their own site.
 *
 * `demosUnlocked` is not tested: it reads Next's request-scoped cookie
 * store, and a test that stubs that store proves the stub works.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEMOS_COOKIE_MAX_AGE,
  demosCookieOptions,
  demosPassword,
  passwordMatches,
  safeDemosReturn,
} from "../src/lib/demosGate.ts";

test("the password falls back to the shared default when unset", () => {
  const previous = process.env.DEMOS_PASSWORD;
  delete process.env.DEMOS_PASSWORD;
  assert.equal(demosPassword(), "ABRAMDEMOS");
  if (previous !== undefined) process.env.DEMOS_PASSWORD = previous;
});

test("the environment wins over the default", () => {
  const previous = process.env.DEMOS_PASSWORD;
  process.env.DEMOS_PASSWORD = "somethingelse";
  assert.equal(demosPassword(), "somethingelse");
  assert.ok(passwordMatches("somethingelse"));
  assert.ok(!passwordMatches("ABRAMDEMOS"));
  if (previous === undefined) delete process.env.DEMOS_PASSWORD;
  else process.env.DEMOS_PASSWORD = previous;
});

test("the right password is accepted, with surrounding whitespace forgiven", () => {
  const previous = process.env.DEMOS_PASSWORD;
  delete process.env.DEMOS_PASSWORD;

  assert.ok(passwordMatches("ABRAMDEMOS"));
  assert.ok(passwordMatches("  ABRAMDEMOS "));

  if (previous !== undefined) process.env.DEMOS_PASSWORD = previous;
});

test("everything else is refused, including the empty and the almost-right", () => {
  const previous = process.env.DEMOS_PASSWORD;
  delete process.env.DEMOS_PASSWORD;

  for (const wrong of ["", "abramdemos", "ABRAMDEMO", "ABRAMDEMOSS", "  "]) {
    assert.ok(!passwordMatches(wrong), JSON.stringify(wrong));
  }
  for (const wrong of [null, undefined, 42, {}, ["ABRAMDEMOS"]]) {
    assert.ok(!passwordMatches(wrong), String(wrong));
  }

  if (previous !== undefined) process.env.DEMOS_PASSWORD = previous;
});

test("the return path never leaves the site", () => {
  assert.equal(safeDemosReturn("/demos?v=call-sheets"), "/demos?v=call-sheets");
  assert.equal(safeDemosReturn("/demos"), "/demos");

  for (const hostile of [
    "https://evil.example/demos",
    "//evil.example/demos",
    "/admin/dashboard",
    "javascript:alert(1)",
    null,
    7,
  ]) {
    assert.equal(safeDemosReturn(hostile), "/demos", String(hostile));
  }
});

test("the cookie cannot be read by page script and lasts thirty days", () => {
  const options = demosCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, DEMOS_COOKIE_MAX_AGE);
  assert.equal(DEMOS_COOKIE_MAX_AGE, 60 * 60 * 24 * 30);
});
