
---

## Privacy & compliance
- **Mandatory masking:** phone numbers are masked at generation; cannot be disabled.
- **Indian IT Act (2000, as amended):** You are responsible for lawful handling of personal data; do not include sensitive data beyond what is necessary.
- **Non-partisan use:** For neutral administrative dossier preparation only.

---

## Licenses
- **Code:** MIT  
- **Templates & samples:** CC BY-NC-SA 4.0  
- **No warranties:** Provided “AS IS”, use at your own risk.

---

## Troubleshooting
- **Netlify build fails on Tectonic:** check `scripts/fetch-tectonic.sh` points to a valid release; ensure build command is `npm run build`.
- **Function 500 / permission denied:** confirm the binary exists at `netlify/functions/bin/tectonic` after build (Netlify logs), and that the build script ran `chmod +x`.
- **Blank PDF or LaTeX error:** open function logs to view the `.log` output captured by Tectonic; often a missing package or a malformed `.tex` block.

---

## Credits
उम्मीदवार दस्तावेज़ (Ummidvaar Dastaavez) — an MMSF-aligned utility for standardised, privacy-first candidate dossiers.
