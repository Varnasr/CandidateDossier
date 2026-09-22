#!/usr/bin/env node
/**
 * Static checks for CandidateDossier. No dependencies, no network, no browser.
 *
 * The repository had no CI beyond a Pages deploy, so nothing here was checked by
 * anything. These are the invariants that break silently:
 *
 *  - the CSV column list lives in three places (index.html, candidate_template.csv,
 *    sample_candidate_data.csv) and a change to one makes the others fail to load
 *    with "CSV missing required columns", which looks like a user error
 *  - user-supplied CSV text is interpolated into two generated documents, and the
 *    escaping was missing in three places
 *  - netlify.toml redirects /api/compile to a function that must exist
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

let failures = 0;
const check = (name, fn) => {
  try {
    const note = fn();
    console.log(`  ok    ${name}${note ? ` (${note})` : ""}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const html = read("index.html");

// ---------------------------------------------------------------------------

check("index.html declares a language", () =>
  assert(/<html[^>]+lang=/.test(html), "no lang attribute on <html>"));

check("index.html has a viewport meta", () =>
  assert(/<meta[^>]+name=["']?viewport/i.test(html),
    "without one, a phone lays the page out at desktop width"));

check("index.html has a title", () =>
  assert(/<title>[^<]+<\/title>/.test(html), "missing <title>"));

check("index.html uses no inline event handlers", () => {
  const found = html.match(/\son(click|change|load|submit|error)\s*=/gi) || [];
  assert(found.length === 0, `found ${found.length}: ${[...new Set(found)].join(", ")}`);
});

// ---------------------------------------------------------------------------
// The column contract, in all three places it is written down.

const headerLine = html.match(/const HEADERS\s*=\s*"([^"]+)"/);
check("index.html declares HEADERS", () =>
  assert(headerLine, "could not find `const HEADERS = \"...\"`"));

const HEADERS = headerLine ? headerLine[1].split(",").map((s) => s.trim()) : [];

for (const csv of ["candidate_template.csv", "sample_candidate_data.csv"]) {
  check(`${csv} matches the app's required columns`, () => {
    const cols = read(csv).split(/\r?\n/)[0].split(",").map((s) => s.trim());
    const norm = (s) => s.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
    const missing = HEADERS.filter((h) => !cols.some((c) => norm(c) === norm(h)));
    assert(missing.length === 0,
      `the app would reject this file: missing ${missing.join(", ")}`);
    return `${cols.length} columns`;
  });
}

check("sample_candidate_data.csv has data rows", () => {
  const rows = read("sample_candidate_data.csv").split(/\r?\n/).filter((r) => r.trim());
  assert(rows.length >= 2, "header only, no data");
  return `${rows.length - 1} rows`;
});

// ---------------------------------------------------------------------------
// Escaping. Both generated documents interpolate values straight from the CSV.

check("no unescaped record fields in generated markup", () => {
  // `${r.field}` or `${r.field || fallback}` inside a template literal, not wrapped
  // in esc(). Conditional guards (`${r.field ? ... }`) are not sinks themselves.
  const sinks = [];
  const re = /\$\{\s*(r\.[a-zA-Z_]+)(\s*\|\|[^}?]*)?\s*\}/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const before = html.slice(Math.max(0, m.index - 60), m.index);
    if (!/esc\(\s*$/.test(before)) sinks.push(m[0]);
  }
  assert(sinks.length === 0,
    `unescaped: ${[...new Set(sinks)].join(", ")}. Wrap in esc().`);
});

// ---------------------------------------------------------------------------
// Deployment config must point at things that exist.

check("netlify.toml redirects resolve to real functions", () => {
  const toml = read("netlify.toml");
  const targets = [...toml.matchAll(/to\s*=\s*"\/\.netlify\/functions\/([\w-]+)"/g)]
    .map((m) => m[1]);
  assert(targets.length > 0, "no function redirects found");
  for (const t of targets) {
    const hit = ["cjs", "js", "mjs"].some((ext) =>
      existsSync(join(ROOT, `netlify/functions/${t}.${ext}`)));
    assert(hit, `redirect targets /.netlify/functions/${t}, which does not exist`);
  }
  return targets.join(", ");
});

check("the compile function is syntactically valid", () => {
  // `new Function` parses without executing, which is all we want here.
  const src = read("netlify/functions/compile.cjs");
  new Function("exports", "require", "module", "__dirname", "__filename", src);
  return `${src.split("\n").length} lines`;
});

// ---------------------------------------------------------------------------

console.log(failures === 0
  ? `\nPASS - all checks passed`
  : `\nFAIL - ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
