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

// A preview picture must be a JPEG or PNG (LinkedIn does not read WebP) of at most
// 250 KB (WhatsApp drops larger ones), at the size the tags declare.
function imageSize(buf) {
  if (buf.length > 24 && buf.toString("latin1", 1, 4) === "PNG") return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}


// ---------------------------------------------------------------------------

check("index.html declares a language", () =>
  assert(/<html[^>]+lang=/.test(html), "no lang attribute on <html>"));

check("index.html has a viewport meta", () =>
  assert(/<meta[^>]+name=["']?viewport/i.test(html),
    "without one, a phone lays the page out at desktop width"));

check("index.html has a title", () =>
  assert(/<title>[^<]+<\/title>/.test(html), "missing <title>"));

check("index.html has a description, a canonical address and matching share tags", () => {
  const url = "https://varnasr.github.io/CandidateDossier/";
  const one = (re) => (html.match(re) || [])[1];
  const desc = one(/<meta name="description" content="([^"]+)"/);
  assert(desc, "missing meta description");
  assert(one(/<link rel="canonical" href="([^"]+)"/) === url, `canonical is not ${url}`);
  assert(one(/<meta property="og:url" content="([^"]+)"/) === url, "og:url does not match the canonical");
  assert(one(/<meta property="og:description" content="([^"]+)"/) === desc, "og:description differs from the description");
  assert(one(/<meta property="og:title" content="([^"]+)"/) === one(/<title>([^<]+)<\/title>/), "og:title differs from the title");
  assert(/<meta name="twitter:card" content="summary_large_image"/.test(html), "twitter:card is not summary_large_image");
});

check("index.html previews with a JPEG or PNG card that exists, within 250 KB", () => {
  const base = "https://varnasr.github.io/CandidateDossier/";
  const one = (re) => (html.match(re) || [])[1];
  const img = one(/<meta property="og:image" content="([^"]+)"/);
  assert(img && img.startsWith(base), `og:image must be an address under ${base}`);
  assert(one(/<meta name="twitter:image" content="([^"]+)"/) === img, "twitter:image differs from og:image");
  assert(one(/<meta property="og:image:width" content="([^"]+)"/) === "1200", "og:image:width is not 1200");
  assert(one(/<meta property="og:image:height" content="([^"]+)"/) === "630", "og:image:height is not 630");
  assert(one(/<meta property="og:image:alt" content="([^"]+)"/), "missing og:image:alt");
  const file = img.slice(base.length);
  assert(existsSync(join(ROOT, file)), `${img} has no file at ${file}`);
  const buf = readFileSync(join(ROOT, file));
  assert(buf.length <= 250000, `${file} is ${buf.length} bytes; WhatsApp drops previews over about 250 KB`);
  const size = imageSize(buf);
  assert(size, `${file} is not a JPEG or PNG`);
  assert(size[0] === 1200 && size[1] === 630, `${file} is ${size[0]}x${size[1]}, the tags say 1200x630`);
  return `${file}, ${buf.length} bytes`;
});

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
