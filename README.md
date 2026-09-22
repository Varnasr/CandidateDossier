# उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-green.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

**CSV → PDF candidate dossier generator** with professional formatting.  
Privacy-first: **phone numbers and emails are always masked**. Pure client-side solution - no server required.

---

## Purpose

District teams often struggle with inconsistent candidate forms and poorly formatted PDFs.  
This tool turns structured CSV data into consistently formatted, print-ready dossiers, one candidate per page.

You upload a structured CSV and get print-ready pages with one candidate each, consistent typography, and phone and email masking applied before anything is rendered.

The PDF comes from your browser's print dialogue, not from LaTeX. A server-side
LaTeX path exists in the repository but is not wired up; see below.

---

## Live Demo

Visit: [https://varnasr.github.io/CandidateDossier/](https://varnasr.github.io/CandidateDossier/)

(This link was a `yourusername` placeholder until 2026-09-22.)

---

## How to Use

1. **Download the CSV template** from the application
2. **Fill in candidate data** with all required fields
3. **Upload your CSV file** to the web interface
4. **Click "Generate PDF"** to open print dialog
5. **Save as PDF** from your browser's print dialog

No installation, no server, no dependencies - everything runs in your browser.

---

## Repository Structure

```
.
├── index.html                  # the entire application (HTML/CSS/JS)
├── candidate_template.csv      # empty template with the required headers
├── sample_candidate_data.csv   # five filled example rows
├── scripts/
│   ├── check.mjs               # static checks, run by CI
│   └── fetch-tectonic.sh       # Netlify build command; opt-in, see below
├── netlify/functions/
│   └── compile.cjs             # server-side LaTeX compile, currently uncalled
├── main_template.tex           # LaTeX templates for the uncalled path
├── candidate_blocks.tex
├── overleaf_sample_project.zip
├── netlify.toml                # routes /api/compile to the function
└── .github/workflows/          # ci.yml (checks) and static.yml (Pages deploy)
```

An earlier version of this section described a `samples/` directory holding
`sample_data.csv`. Neither has ever existed; the CSVs are at the root under the
names above.

---

## CSV Schema

The CSV must have these exact headers (18 fields):

```
preference,name,category,caste,age,gender,occupation,education,year_joined,phone,email,criminal_record,rationale,strengths,weaknesses,proposers,positions_held,elections_contested
```

### Field Descriptions:

| Field | Description | Example |
|-------|-------------|---------|
| preference | Priority order (1,2,3...) | 1 |
| name | Full candidate name | "Rajender Kumar Chaudhary" |
| category | Reservation category | OBC |
| caste | Caste/Community | Jat |
| age | Age in years | 54 |
| gender | Gender | Male |
| occupation | Current occupation | "Advocate/Farmer" |
| education | Educational qualifications | "BA, LLB, LLM (Pursuing)" |
| year_joined | Year joined party | 1985 |
| phone | Mobile number (will be masked) | 9012239999 |
| email | Email address (will be masked) | rajender@example.com |
| criminal_record | Any criminal cases | "No adverse records" |
| rationale | Reason for candidacy | "Belief in party ideology..." |
| strengths | Key strengths | "Strong administrative connections..." |
| weaknesses | Areas for improvement | "Limited digital experience" |
| proposers | Supporting leaders | "Ram Singh (Ex HM); Furkan Ahmed (MLA)" |
| positions_held | Party/organizational positions | "Ward President (2010-2015)" |
| elections_contested | Electoral history | "Assembly 2022 (Runner-up)" |

---

## Privacy and Compliance

* **Phone masking:** Automatically shows only last 4 digits (******2345)
* **Email masking:** Shows only first letter and domain (r***@example.com)  
* **No data storage:** All processing happens client-side
* **No data transmission:** Your CSV never leaves your browser
* **Compliance:** Follows Indian IT Act (2000, amended) and data minimization principles
* **Non-partisan:** For neutral administrative documentation only

---

## Deployment Options

### Option 1: GitHub Pages (Recommended)
1. Fork or upload this repository to your GitHub account
2. Go to **Settings → Pages**
3. Set **Source** to "Deploy from a branch"
4. Select **main** branch and **/ (root)** folder
5. Click **Save**
6. Your site will be live at `https://<your-account>.github.io/CandidateDossier/`

### Option 2: Any Static Host
Simply upload `index.html` to any web server. The application is completely self-contained.

### Option 3: Local Use
Open `index.html` directly in your browser. Note: Some browsers may restrict file uploads when opened locally.

---

## Design System

Professional colour palette optimized for readability:

* **Primary Blue:** #1e3a8a (Headers, buttons)
* **Gold Accent:** #fbbf24 (Badges, section dividers)
* **Navy Text:** #0f172a (Body text)
* **Grey:** #64748b (Secondary text)

Typography follows LaTeX conventions:
* Headers: Arial/Sans-serif
* Body text: Times New Roman/Serif
* Optimal print margins and spacing

---

## Features

* **Print-ready output** through the browser's print dialogue, with print-specific CSS
* **One-page-per-candidate** format for easy filing
* **Automatic data masking** for privacy protection
* **Dark mode support** for comfortable viewing
* **CSV validation** with clear error messages
* **Preview mode** before generating PDF
* **No dependencies** - pure HTML/CSS/JavaScript
* **Offline capable** - works without internet once loaded

---

## Browser Compatibility

Works on all modern browsers:
* Chrome/Edge 90+
* Firefox 88+
* Safari 14+
* Opera 76+

For best PDF output, use Chrome or Edge.

---

## Technical Notes

* **CSV Parsing:** Handles quoted fields, commas within quotes, and various line endings
* **PDF Generation:** Uses browser print functionality with CSS print media queries
* **Masking:** Applied at render time, original data never displayed
* **Character Encoding:** Full UTF-8 support for Hindi/regional text

---

## Testing

```bash
node scripts/check.mjs
```

No dependencies, no network, no browser. It checks the page basics (lang,
viewport, title, no inline handlers), that the required column list in
`index.html` matches both shipped CSVs, that no CSV field reaches generated
markup unescaped, that the `netlify.toml` redirect points at a function that
exists, and that `compile.cjs` parses. CI runs it on every push and pull
request; before 2026-09-22 there was no CI beyond the Pages deploy.

Three escaping defects were fixed at the same time. `r.preference` in both the
preview and the print window, and the combined category/caste string, went into
generated HTML unescaped, so a candidate list received from someone else could
inject markup into the printed dossier. The guard was fault-injected to confirm
it catches the real case.

## The server-side compile path is not wired up

`netlify/functions/compile.cjs` compiles a dossier with Tectonic and
`netlify.toml` routes `/api/compile` to it, but nothing in the application calls
it: `index.html` parses the CSV in the browser and produces the PDF through the
print dialogue. The `.tex` templates and the Overleaf zip belong to that same
unused path.

`npm run build` was downloading a 37 MB LaTeX engine from a third-party GitHub
release on every deploy to serve that endpoint, and would have failed the deploy
if the release were unavailable. That download is now opt-in: set
`BUILD_COMPILE_FUNCTION=1` in the Netlify environment to restore it. Nothing was
deleted, so wiring the front end to `/api/compile` later needs only that
variable.

If the function is wired up, note that it returns **HTTP 200 on failure**: when
the LaTeX does not compile it falls back to a near-empty document reading
"Compilation Fallback" and puts the real error in a base64
`X-Compile-Diagnostics` header. A front end that ignores that header gives the
user a successful-looking download of a blank dossier.

## Legal & Licensing

* **Code:** MIT License
* **Documentation:** CC BY-NC-SA 4.0
* **No warranties:** Provided "AS IS" without guarantees of suitability
* **Compliance:** Intended for lawful use under Indian IT Act, 2000
* **Non-partisan:** For standardized administrative documentation only

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| File upload doesn't work | Check file is .csv format, not .xlsx or .pdf |
| Missing columns error | Ensure all 18 required headers are present |
| PDF looks different than preview | Use Chrome/Edge for best print output |
| Phone numbers not masked | This is automatic and cannot be disabled |
| Special characters display incorrectly | Save CSV as UTF-8 encoding |

---

## Attribution

**उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)**  
Built for transparent, standardized, and inclusive documentation.  
Professional design system for government and civic applications.

---

## Credits

* **Technology:** HTML5, CSS3, JavaScript (ES6+)
* **License:** MIT (code) + CC BY-NC-SA (content)

---

## Version History

* **v1.0.0** (2025) - Initial release with core functionality
  * CSV upload and validation
  * Professional PDF generation
  * Mandatory privacy masking
  * Professional design system implementation
