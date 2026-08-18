/**
 * A `"use server"` file may only export async functions.
 *
 * This is not a style rule, it is how the compiler works. Next rewrites
 * every export of a `"use server"` module into a server action reference.
 * A constant exported from one survives type checking and the build, and
 * then arrives in the browser as a function — so the accounts screen,
 * which rendered one `<option>` per entry of an `ACCOUNT_LIFECYCLES`
 * array imported from `actions.ts`, died in production on
 * `w.map is not a function` before it drew a single row.
 *
 * Nothing in the toolchain catches that, so this does. It is a source
 * scan rather than a runtime import, because importing a server module
 * outside Next does not reproduce the rewrite that causes the bug.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** The directive has to be the first statement, ignoring comments. */
function isServerModule(source: string): boolean {
  return /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*["']use server["']/.test(source);
}

/**
 * Exports that are not `async function` and not type-only.
 *
 * `export type`, `export interface` and `export const enum` vanish at
 * compile time and never reach the rewrite, so they are fine.
 */
function offendingExports(source: string): string[] {
  const bad: string[] = [];
  const pattern = /^export\s+(?!type\b|interface\b|default\s+async\b|async\s+function\b)(\w+)\s+(\w+)?/gm;
  for (const match of source.matchAll(pattern)) {
    bad.push(`${match[1]} ${match[2] ?? ""}`.trim());
  }
  return bad;
}

test("no \"use server\" module exports a value", () => {
  const failures: string[] = [];

  for (const file of walk(SRC)) {
    const source = readFileSync(file, "utf8");
    if (!isServerModule(source)) continue;
    for (const bad of offendingExports(source)) {
      failures.push(`${path.relative(ROOT, file)}: export ${bad}`);
    }
  }

  assert.deepEqual(
    failures,
    [],
    `A "use server" module may only export async functions. Move these to a plain module:\n  ${failures.join("\n  ")}`
  );
});
