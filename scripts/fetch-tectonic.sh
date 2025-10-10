#!/usr/bin/env bash
set -euo pipefail

# Version pin (Linux x86_64)
TECTONIC_TGZ="tectonic-0.15.0+20251006-x86_64-unknown-linux-gnu.tar.gz"
TECTONIC_URL="https://github.com/tectonic-typesetting/tectonic/releases/download/continuous/${TECTONIC_TGZ}"

echo "==> Fetching Tectonic from ${TECTONIC_URL}"
mkdir -p netlify/functions/bin /tmp/tectonic-dl
curl -L --fail "${TECTONIC_URL}" -o /tmp/tectonic-dl/tectonic.tar.gz

echo "==> Extracting"
tar -xzf /tmp/tectonic-dl/tectonic.tar.gz -C /tmp/tectonic-dl

# Find the 'tectonic' executable inside whatever directory the tar created
TECTONIC_BIN="$(find /tmp/tectonic-dl -type f -name tectonic -maxdepth 3 | head -n1)"
if [ -z "${TECTONIC_BIN}" ]; then
  echo "ERROR: could not find 'tectonic' in archive" >&2
  exit 1
fi

echo "==> Installing to netlify/functions/bin/tectonic"
cp "${TECTONIC_BIN}" netlify/functions/bin/tectonic
chmod +x netlify/functions/bin/tectonic
echo "==> Done"
