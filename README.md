# उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-green.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

**CSV → PDF candidate dossier generator** with professional formatting.  
Privacy-first: **phone numbers and emails are always masked**. Pure client-side solution - no server required.

---

## 🎯 Purpose

District teams often struggle with inconsistent candidate forms and poorly formatted PDFs.  
This tool transforms structured CSV data into professional, LaTeX-quality PDF dossiers with consistent formatting.

You simply upload a structured CSV and get print-ready PDFs with one candidate per page, professional typography, and automatic privacy protection.

---

## 🚀 Live Demo

Visit: [https://yourusername.github.io/ummidvaar-dastaavez/](https://yourusername.github.io/ummidvaar-dastaavez/)

---

## 🧩 How to Use

1. **Download the CSV template** from the application
2. **Fill in candidate data** with all required fields
3. **Upload your CSV file** to the web interface
4. **Click "Generate PDF"** to open print dialog
5. **Save as PDF** from your browser's print dialog

No installation, no server, no dependencies - everything runs in your browser.

---

## 🧱 Repository Structure

```
.
├── index.html                  # Complete web application (HTML/CSS/JS)
├── README.md                   # This file
├── LICENSE                     # MIT License
├── .gitignore                  # Git ignore rules
└── samples/
    ├── candidate_template.csv  # Empty template with headers
    └── sample_data.csv         # Example with filled data
```

---

## 🧾 CSV Schema

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

## 🔒 Privacy and Compliance

* **Phone masking:** Automatically shows only last 4 digits (******2345)
* **Email masking:** Shows only first letter and domain (r***@example.com)  
* **No data storage:** All processing happens client-side
* **No data transmission:** Your CSV never leaves your browser
* **Compliance:** Follows Indian IT Act (2000, amended) and data minimization principles
* **Non-partisan:** For neutral administrative documentation only

---

## ⚙️ Deployment Options

### Option 1: GitHub Pages (Recommended)
1. Fork or upload this repository to your GitHub account
2. Go to **Settings → Pages**
3. Set **Source** to "Deploy from a branch"
4. Select **main** branch and **/ (root)** folder
5. Click **Save**
6. Your site will be live at `https://yourusername.github.io/ummidvaar-dastaavez/`

### Option 2: Any Static Host
Simply upload `index.html` to any web server. The application is completely self-contained.

### Option 3: Local Use
Open `index.html` directly in your browser. Note: Some browsers may restrict file uploads when opened locally.

---

## 🎨 Design System

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

## ✨ Features

* **Professional PDF output** with LaTeX-quality typography
* **One-page-per-candidate** format for easy filing
* **Automatic data masking** for privacy protection
* **Dark mode support** for comfortable viewing
* **CSV validation** with clear error messages
* **Preview mode** before generating PDF
* **No dependencies** - pure HTML/CSS/JavaScript
* **Offline capable** - works without internet once loaded

---

## ⚠️ Browser Compatibility

Works on all modern browsers:
* Chrome/Edge 90+
* Firefox 88+
* Safari 14+
* Opera 76+

For best PDF output, use Chrome or Edge.

---

## 📘 Technical Notes

* **CSV Parsing:** Handles quoted fields, commas within quotes, and various line endings
* **PDF Generation:** Uses browser print functionality with CSS print media queries
* **Masking:** Applied at render time, original data never displayed
* **Character Encoding:** Full UTF-8 support for Hindi/regional text

---

## ⚠️ Legal & Licensing

* **Code:** MIT License
* **Documentation:** CC BY-NC-SA 4.0
* **No warranties:** Provided "AS IS" without guarantees of suitability
* **Compliance:** Intended for lawful use under Indian IT Act, 2000
* **Non-partisan:** For standardized administrative documentation only

---

## 🧰 Troubleshooting

| Issue | Solution |
|-------|----------|
| File upload doesn't work | Check file is .csv format, not .xlsx or .pdf |
| Missing columns error | Ensure all 18 required headers are present |
| PDF looks different than preview | Use Chrome/Edge for best print output |
| Phone numbers not masked | This is automatic and cannot be disabled |
| Special characters display incorrectly | Save CSV as UTF-8 encoding |

---

## 🪶 Attribution

**उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez)**  
Built for transparent, standardized, and inclusive documentation.  
Professional design system for government and civic applications.

---

## 🧠 Credits

* **Technology:** HTML5, CSS3, JavaScript (ES6+)
* **License:** MIT (code) + CC BY-NC-SA (content)

---

## 📝 Version History

* **v1.0.0** (2025) - Initial release with core functionality
  * CSV upload and validation
  * Professional PDF generation
  * Mandatory privacy masking
  * Professional design system implementation
