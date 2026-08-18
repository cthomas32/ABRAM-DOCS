/**
 * Teaching Node's loader what the bundler already knows.
 *
 * Application code is written for Next, so it imports `./constants` and
 * `@/lib/...` without extensions. Node's ESM resolver does neither, and
 * the alternative — rewriting every import in the application so a test
 * runner can read it — is the tail wagging the dog.
 *
 * So: two rules, and only for specifiers that would otherwise fail.
 * Nothing here changes how the application is built or shipped.
 */

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CANDIDATES = [".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"];

function firstThatExists(base) {
  for (const suffix of CANDIDATES) {
    if (existsSync(base + suffix)) return base + suffix;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  // The `@/*` alias from tsconfig.
  if (specifier.startsWith("@/")) {
    const resolved = firstThatExists(path.join(ROOT, "src", specifier.slice(2)));
    if (resolved) return next(pathToFileURL(resolved).href, context);
  }

  // A relative import with no extension, which is every import in src.
  if (specifier.startsWith(".") && !path.extname(specifier)) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : ROOT;
    const resolved = firstThatExists(path.resolve(path.dirname(parentPath), specifier));
    if (resolved) return next(pathToFileURL(resolved).href, context);
  }

  return next(specifier, context);
}
