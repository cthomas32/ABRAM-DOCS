/**
 * Nothing mails anybody by accident.
 *
 * Two different jobs here, and the second is the one that lasts.
 *
 * The first is the ordinary unit test: the switch is off unless the
 * environment says exactly "true".
 *
 * The second walks the source and asserts that **every file able to
 * deliver mail imports the guard**. A switch that a new send path forgets
 * to consult is not a switch, it is a comment, and the whole point of the
 * flag is that the failure mode of forgetting is "nobody was emailed"
 * rather than "thirty strangers were". If you add a send and this test
 * fails, the fix is to call `blockedReason()` first and not to add your
 * file to the exemption list, because there isn't one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  blockedReason,
  sendingAllowed,
  SENDING_BLOCKED_MESSAGE,
} from "../src/lib/email/outbound.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ */
/*  The switch                                                         */
/* ------------------------------------------------------------------ */

function withEnv(value: string | undefined, run: () => void) {
  const had = Object.prototype.hasOwnProperty.call(process.env, "EMAIL_SENDING_ENABLED");
  const previous = process.env.EMAIL_SENDING_ENABLED;
  if (value === undefined) delete process.env.EMAIL_SENDING_ENABLED;
  else process.env.EMAIL_SENDING_ENABLED = value;
  try {
    run();
  } finally {
    if (had) process.env.EMAIL_SENDING_ENABLED = previous;
    else delete process.env.EMAIL_SENDING_ENABLED;
  }
}

test("sending is off when the flag is absent", () => {
  withEnv(undefined, () => {
    assert.equal(sendingAllowed(), false);
    assert.equal(blockedReason(), SENDING_BLOCKED_MESSAGE);
  });
});

test("only the exact string true opens the gate", () => {
  withEnv("true", () => {
    assert.equal(sendingAllowed(), true);
    assert.equal(blockedReason(), null);
  });
});

test("every near miss stays blocked", () => {
  for (const value of ["TRUE", "True", "1", "yes", "on", "", " true", "true ", "false"]) {
    withEnv(value, () => {
      assert.equal(sendingAllowed(), false, `"${value}" must not enable sending`);
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Nothing bypasses it                                                */
/* ------------------------------------------------------------------ */

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts)$/.test(entry)) out.push(full);
  }
  return out;
}

/** The Resend calls that put mail in front of a person. */
const DELIVERS = /\b(?:emails|broadcasts|batch)\s*\.\s*send\s*\(/;

test("every file that can deliver mail consults the guard", () => {
  const offenders: string[] = [];

  for (const file of walk(path.join(ROOT, "src"))) {
    const source = readFileSync(file, "utf8");
    if (!DELIVERS.test(source)) continue;

    // The guard module itself is allowed to mention sending.
    if (file.endsWith(path.join("lib", "email", "outbound.ts"))) continue;

    if (!source.includes("@/lib/email/outbound")) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    "these files can deliver mail without importing the send switch:\n  " + offenders.join("\n  ")
  );
});

test("the sweep would actually notice a new send site", () => {
  // Guards the guard: if the pattern above stops matching the real calls,
  // the test above passes for the wrong reason and silently protects
  // nothing. These are the three shapes the codebase uses.
  assert.ok(DELIVERS.test("await resend.emails.send({"));
  assert.ok(DELIVERS.test("await resend.broadcasts.send(id);"));
  assert.ok(DELIVERS.test("const r = await resend.batch.send(payload)"));
  assert.ok(!DELIVERS.test("resend.contacts.create({"), "audience writes are not deliveries");
});
