# CandidateDossier (Ummidvaar Dastaavez)

Turns a CSV of candidate records into printable one-page dossiers. Static site,
no framework, no build step for the part that runs.

## Commands

```bash
python3 -m http.server 8000      # then open http://localhost:8000
node scripts/check.mjs           # static checks, no deps, no network
```

## How it actually works

`index.html` is the whole application. It parses the uploaded CSV in the
browser, renders an on-page preview, and produces the PDF by opening a second
window and calling `window.print()`. There is no server in the path.

## The Netlify function has no caller

`netlify/functions/compile.cjs` compiles a dossier server side with Tectonic,
and `netlify.toml` routes `/api/compile` to it. **Nothing calls it.** A search on
2026-09-22 found no reference to `/api/compile` or `.netlify/functions` anywhere
outside the function's own source. `main_template.tex`, `candidate_blocks.tex`
and `overleaf_sample_project.zip` are likewise referenced by neither
`index.html` nor the README.

`npm run build` runs `scripts/fetch-tectonic.sh`, which was downloading a 37 MB
LaTeX engine from a third-party GitHub release on **every deploy** to serve that
endpoint, and failing the deploy if the URL was unavailable.

The download is now opt-in behind `BUILD_COMPILE_FUNCTION=1`. Nothing was
deleted: the function, the templates and the redirect are all still there, so
wiring the front end to it needs only that environment variable in Netlify.

**This is a decision waiting to be made, not a resolved question.** Either wire
the front end to `/api/compile` (server-side LaTeX gives far better typography
than a print dialogue, which is presumably why it was built), or delete the
function, the redirect, the build command and the `.tex` files. Leaving it in
the third state is how it came to cost a 37 MB download for nothing.

## Watch out for

- **The column list is written in three places**: `const HEADERS` in
  `index.html`, `candidate_template.csv`, and `sample_candidate_data.csv`.
  Change one and the app rejects the others with "CSV missing required columns",
  which reads as a user error rather than a repository bug. `scripts/check.mjs`
  compares all three.
- **Everything from the CSV is interpolated into generated markup.** Both the
  preview and the print window build HTML from template literals. Three sinks
  were unescaped (`r.preference` in both paths, and `categoryInfo` built from
  `r.category` and `r.caste`), so a candidate list from a third party could
  inject markup into the printed document. Use `esc()` on every record field;
  `check.mjs` fails on any `${r.field}` not wrapped in it, and that check was
  fault-injected to confirm it catches the real case.
- **`compile.cjs` returns HTTP 200 on failure.** When the supplied LaTeX does not
  compile it falls back to a near-empty document reading "Compilation Fallback"
  and returns it with status 200, putting the real error in a base64
  `X-Compile-Diagnostics` header. If the function is ever wired up, the front end
  must read that header, or a user whose input was rejected gets a
  successful-looking download of a blank dossier.
- **Two deploy targets.** `.github/workflows/static.yml` publishes to GitHub
  Pages and `netlify.toml` configures Netlify. The application is fully
  client-side, so the Pages copy works; only `/api/compile` would be missing
  there, and nothing calls it.
- **Phone and email are masked** in both render paths, by `maskPhone` (last four
  digits) and `maskEmail` (first letter plus domain). Verified 2026-09-22: both
  are applied in the preview and in the print window, so the README's privacy
  claim holds. The CSV itself is never uploaded anywhere, which is what makes the
  browser-side design defensible for candidate data. If you add a field to the
  rendered output, check whether it needs a mask before it needs escaping.

## CI

`.github/workflows/ci.yml` runs `scripts/check.mjs`, parses the build script,
and asserts the build downloads nothing without the opt-in flag. Before this
there was no CI beyond the Pages deploy, so none of the invariants above were
checked by anything.
