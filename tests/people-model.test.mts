/**
 * The two merge rules every feed shares.
 *
 * `withSource` and `advanceLifecycle` are small enough to look obviously
 * correct and are called from five places, which is exactly the shape of
 * function that quietly grows a sixth caller with different expectations.
 * The rule that matters most is the one about not moving somebody
 * backwards: a customer who fills in a marketing form must not be
 * demoted to a lead, and that is a bug nobody notices until a commission
 * report is wrong.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceLifecycle, withSource, lifecycleSpec } from "../src/lib/crm/people.ts";

test("a source is added once, however many times it arrives", () => {
  assert.deepEqual(withSource([], "newsletter"), ["newsletter"]);
  assert.deepEqual(withSource(["newsletter"], "newsletter"), ["newsletter"]);
});

test("sources accumulate rather than replace", () => {
  const after = withSource(["qr_card"], "newsletter");
  assert.ok(after.includes("qr_card"), "the first way in survives");
  assert.ok(after.includes("newsletter"), "the new one is recorded");
});

test("an unrecognised source from an older row cannot break the constraint", () => {
  assert.deepEqual(withSource(["something_retired"], "form"), ["form"]);
});

test("the order is stable, so two runs write the same array", () => {
  const a = withSource(["form", "newsletter"], "event");
  const b = withSource(["newsletter", "event"], "form");
  assert.deepEqual(a, b);
});

test("a feed moves somebody forwards", () => {
  assert.equal(advanceLifecycle("subscriber", "lead"), "lead");
  assert.equal(advanceLifecycle("lead", "customer"), "customer");
});

test("a feed never moves somebody backwards", () => {
  assert.equal(advanceLifecycle("customer", "subscriber"), "customer");
  assert.equal(advanceLifecycle("sql", "lead"), "sql");
});

test("churned is terminal and only a human sets it", () => {
  assert.equal(advanceLifecycle("churned", "customer"), "churned");
});

test("an unknown lifecycle reads as lead rather than throwing", () => {
  assert.equal(lifecycleSpec(null).id, "lead");
  assert.equal(lifecycleSpec("nonsense").id, "lead");
});
