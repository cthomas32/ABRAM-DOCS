/**
 * The lock on /demos, tested.
 *
 * Three things here can fail silently. A comparison that accepts
 * something it should not opens the library to anybody. A return path
 * that accepts an absolute url turns the unlock form into an open
 * redirect somebody can point at their own site. And a cookie that does
 * not depend on the password would survive a password change, which is
 * the one thing changing a shared password is supposed to do.
 *
 * The database read is not tested here: it lives in `demosSettings.ts`
 * behind a Supabase client, and everything decidable without one takes
 * the resolved password as an argument on purpose.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_DEMOS_PASSWORD,
  DEMOS_COOKIE_MAX_AGE,
  demosCookieMarker,
  demosCookieOptions,
  passwordMatches,
  resolveDemosPassword,
  safeDemosReturn,
  unlockedByCookie,
} from "../src/lib/demosGate.ts";

/** Run a block with DEMOS_PASSWORD set to something, or to nothing. */
function withEnv(value: string | undefined, run: () => void): void {
  const previous = process.env.DEMOS_PASSWORD;
  if (value === undefined) delete process.env.DEMOS_PASSWORD;
  else process.env.DEMOS_PASSWORD = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.DEMOS_PASSWORD;
    else process.env.DEMOS_PASSWORD = previous;
  }
}

/* ------------------------------------------------------------------ */
/*  Resolution order: stored → environment → default                   */
/* ------------------------------------------------------------------ */

test("a stored password wins over the environment and the default", () => {
  withEnv("fromtheenvironment", () => {
    assert.equal(resolveDemosPassword("fromthedatabase"), "fromthedatabase");
  });
});

test("the environment is used when nothing is stored", () => {
  withEnv("fromtheenvironment", () => {
    assert.equal(resolveDemosPassword(null), "fromtheenvironment");
    assert.equal(resolveDemosPassword(undefined), "fromtheenvironment");
  });
});

test("the default runs when nothing is stored and nothing is set", () => {
  withEnv(undefined, () => {
    assert.equal(resolveDemosPassword(null), DEFAULT_DEMOS_PASSWORD);
    assert.equal(DEFAULT_DEMOS_PASSWORD, "ABRAMDEMOS");
  });
});

test("blank counts as absent at every level, so nothing falls through to an empty password", () => {
  withEnv("fromtheenvironment", () => {
    assert.equal(resolveDemosPassword(""), "fromtheenvironment");
    assert.equal(resolveDemosPassword("   "), "fromtheenvironment");
  });

  withEnv("   ", () => {
    assert.equal(resolveDemosPassword(""), DEFAULT_DEMOS_PASSWORD);
  });
});

test("a stored password is trimmed, so a pasted trailing space is not part of it", () => {
  withEnv(undefined, () => {
    assert.equal(resolveDemosPassword("  openthedoor \n"), "openthedoor");
  });
});

/* ------------------------------------------------------------------ */
/*  The comparison                                                     */
/* ------------------------------------------------------------------ */

test("the right password is accepted, with surrounding whitespace forgiven", () => {
  assert.ok(passwordMatches("ABRAMDEMOS", "ABRAMDEMOS"));
  assert.ok(passwordMatches("  ABRAMDEMOS ", "ABRAMDEMOS"));
});

test("everything else is refused, including the empty and the almost-right", () => {
  for (const wrong of ["", "abramdemos", "ABRAMDEMO", "ABRAMDEMOSS", "  "]) {
    assert.ok(!passwordMatches(wrong, "ABRAMDEMOS"), JSON.stringify(wrong));
  }
  for (const wrong of [null, undefined, 42, {}, ["ABRAMDEMOS"]]) {
    assert.ok(!passwordMatches(wrong, "ABRAMDEMOS"), String(wrong));
  }
});

test("the old password stops working the moment a new one is stored", () => {
  withEnv(undefined, () => {
    const now = resolveDemosPassword("thenewword");
    assert.ok(passwordMatches("thenewword", now));
    assert.ok(!passwordMatches("ABRAMDEMOS", now));
  });
});

/* ------------------------------------------------------------------ */
/*  The cookie, and what a password change does to it                  */
/* ------------------------------------------------------------------ */

test("the cookie marker is derived from the password, and is not the password", () => {
  const marker = demosCookieMarker("ABRAMDEMOS");
  assert.match(marker, /^[0-9a-f]{16}$/);
  assert.ok(!marker.includes("ABRAMDEMOS"));
  assert.equal(marker, demosCookieMarker("ABRAMDEMOS"));
  assert.notEqual(marker, demosCookieMarker("ABRAMDEMOS2"));
});

test("a cookie issued under the current password is accepted", () => {
  const options = demosCookieOptions("ABRAMDEMOS");
  assert.ok(unlockedByCookie(options.value, "ABRAMDEMOS"));
});

test("changing the password re-locks every browser that was already in", () => {
  const before = demosCookieOptions("theoldword").value;

  assert.ok(unlockedByCookie(before, "theoldword"));
  assert.ok(!unlockedByCookie(before, "thenewword"));

  /* And the new cookie is the one that works from then on. */
  const after = demosCookieOptions("thenewword").value;
  assert.ok(unlockedByCookie(after, "thenewword"));
  assert.ok(!unlockedByCookie(after, "theoldword"));
});

test("the marker that used to be hard-coded no longer opens anything", () => {
  assert.ok(!unlockedByCookie("unlocked", "ABRAMDEMOS"));
  assert.ok(!unlockedByCookie("", "ABRAMDEMOS"));
  assert.ok(!unlockedByCookie(undefined, "ABRAMDEMOS"));
});

test("the cookie cannot be read by page script and lasts thirty days", () => {
  const options = demosCookieOptions("ABRAMDEMOS");
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, DEMOS_COOKIE_MAX_AGE);
  assert.equal(DEMOS_COOKIE_MAX_AGE, 60 * 60 * 24 * 30);
});

/* ------------------------------------------------------------------ */
/*  Where the form sends you afterwards                                */
/* ------------------------------------------------------------------ */

test("the return path never leaves the site, and keeps a deep link intact", () => {
  assert.equal(safeDemosReturn("/demos?v=call-sheets"), "/demos?v=call-sheets");
  assert.equal(safeDemosReturn("/demos?f=for-film-programs"), "/demos?f=for-film-programs");
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
