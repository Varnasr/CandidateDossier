
# उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-green.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/ummidvaar-dastaavez/deploys)

**CSV → LaTeX → PDF candidate dossier generator** using the **Manmohan Singh Fellowship** colour palette.  
Privacy-first: **phone numbers are always masked**. Works with **Overleaf** or via **Netlify Functions** for one-click PDF generation.

---

## 🎯 Purpose

District teams often struggle with inconsistent candidate forms and poorly formatted PDFs.  
This tool separates **content** (CSV) from **presentation** (LaTeX), enabling standardised, print-ready candidate dossiers.

You simply upload a structured CSV, review automatically generated LaTeX blocks, and either:
1. Compile on **Overleaf** (manual but flexible), or  
2. Use the **Netlify-hosted build** to instantly get a PDF.

---

## 🧩 Two Ways to Use

### A. Overleaf (no setup required)
1. Prepare your CSV (see “CSV schema” below).  
2. On the site, upload your CSV → click **Generate LaTeX Blocks**.  
3. Download two files:
   - **`candidate_blocks.tex`**
   - **`main.tex`** (layout template)
4. Go to [Overleaf](https://www.overleaf.com/).  
5. Create a new project and upload both `.tex` files.  
6. Ensure that inside `main.tex`, the line  
   ```latex
   \input{candidate_blocks.tex}
````

appears where you want the candidate details inserted.
7. Compile → Download PDF.

---

### B. Netlify One-Click PDF (serverless)

1. This repo includes a Netlify Function `/api/compile`.
2. When you deploy to Netlify, the build script (`scripts/fetch-tectonic.sh`) **downloads the Tectonic LaTeX engine** automatically.
3. On the site, after generating LaTeX blocks, click **Upload CSV → Get PDF**.
4. The compiled dossier PDF downloads instantly.

---

## 🧱 Repo Structure

```
.
├── index.html                  # Web app (CSV → LaTeX blocks; masking enforced)
├── netlify.toml                # Routes /api/compile → function
├── package.json                # Build step: fetches Tectonic binary
├── netlify/
│   └── functions/
│       ├── compile.js          # Serverless: runs Tectonic to produce PDF
│       └── bin/                # (filled at build) tectonic binary goes here
├── scripts/
│   └── fetch-tectonic.sh       # Downloads Linux x86_64 Tectonic during build
├── .gitignore
└── README.md
```

---

## 🧾 CSV Schema

The CSV should have these exact headers:

```
preference,name,category,caste,age,occupation,education,joined,phone,record,rationale,strengths,weaknesses,proposers,positions,elections
```

Each row is one candidate.

Example row:

```
1,"Rajender Kumar Chaudhary","OBC","Jat",54,"Advocate & Farmer","BA, LLB, LLM (Pursuing)",1985,9012239999,,"Belief in Congress ideology; long family history.","College-days NSUI; administrative hold; strong proposer set.","—","Ram Singh (Ex HM, 5× MLA); Furkan Ahmed (MLA)","Ward President (2010–2015); DCC Member (2018–)","Contested Nagar Palika 2019 (Won); Assembly 2022 (Runner-up)"
```

---

## 🔒 Privacy and Compliance

* **Phone numbers are masked automatically** — cannot be disabled.
* **Compliance:** Follows Indian IT Act (2000, amended) and data minimisation principles.
* **Non-partisan:** For neutral administrative documentation only.

---

## ⚙️ Deployment Guide (GitHub web UI only)

1. Upload all files to your GitHub repo (as shown in the structure above).
2. In **Netlify → Add new site → Import from GitHub → select this repo**.
3. **Build command:** `npm run build`
   **Publish directory:** *(leave blank)*
4. Click **Deploy**.

Netlify will:

* Run `scripts/fetch-tectonic.sh`
* Download and install the correct Tectonic binary
* Make it executable
* Deploy the web interface (`index.html`)
* Activate the serverless function for PDF generation

---

## 📘 Overleaf Template Description

`main.tex` uses the **MMSF colour palette**:

* Light blue, yellow, and black on white background
* Pale grey highlights for section headers
* Clean and readable layout for dossiers
* Automatically paginated and formatted

Masking and formatting rules ensure clean presentation and compliance.

---

## ⚠️ Legal & Licensing

* **Code:** MIT License
* **Templates and Samples:** CC BY-NC-SA 4.0
* **No warranties:** Provided “AS IS,” without guarantees of suitability.
* **Compliance:** Intended for lawful and educational use under the Indian IT Act, 2000.
* **Non-partisan:** Meant for standardised administrative documentation.

---

## 🧰 Troubleshooting

| Issue                         | Likely Cause                                                 | Fix                                   |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Build fails on Netlify        | Tectonic URL changed                                         | Update script with latest release URL |
| Function returns 500          | Binary missing or not executable                             | Check deploy log for `chmod +x` step  |
| PDF blank or fails to compile | Invalid LaTeX block                                          | Inspect function log to see TeX error |
| Button stays disabled         | You must click “Generate LaTeX Blocks” before requesting PDF | Generate blocks first                 |

---

## 🪶 Attribution

**उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)**
Built under the **Manmohan Singh Fellowship** initiative for transparent, standardised, and inclusive documentation.
Colour system and typographic guidelines follow the MMSF design language.

---

## 🧠 Credits

* **Concept and Design:** Dr. Varna Sri Raman
* **Framework:** Manmohan Singh Fellowship Knowledge & Systems Team
* **Tools:** LaTeX (Tectonic), HTML5, Netlify Functions
* **License:** MIT (code) + CC BY-NC-SA (content)

```

