#!/usr/bin/env bash
set -euo pipefail

# Always fetch the MUSL build (static) to avoid glibc deps like libgraphite2.so.3
VER="0.15.0"
TARGET="x86_64-unknown-linux-musl"
NAME="tectonic-${VER}-${TARGET}"
RELEASE_TAG="tectonic%40${VER}"

echo "Cleaning old binaries…"
rm -rf netlify/functions/bin
mkdir -p netlify/functions/bin
cd netlify/functions/bin

URL_MAIN="https://github.com/tectonic-typesetting/tectonic/releases/download/${RELEASE_TAG}/${NAME}.tar.gz"

echo "Downloading Tectonic (MUSL)…"
curl -fsSL "$URL_MAIN" -o tt.tgz

echo "Extracting…"
tar -xzf tt.tgz

# Find the binary we just extracted (path varies slightly per release)
BIN="$(find . -type f -name tectonic -perm -u+x | head -n1 || true)"
if [ -z "$BIN" ]; then
  BIN="$(find . -type f -name tectonic | head -n1 || true)"
fi
if [ -z "$BIN" ]; then
  echo "ERROR: tectonic binary not found in archive."; exit 1
fi

mv "$BIN" ./tectonic
chmod +x ./tectonic
rm -rf ./*/ tt.tgz

echo "Tectonic ready at $(pwd)/tectonic"
