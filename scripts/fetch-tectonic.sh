#!/usr/bin/env bash
set -euo pipefail

# Downloads the Tectonic LaTeX engine (~30 MB) so netlify/functions/compile.cjs
# can compile a dossier server side.
#
# Nothing in the shipped application calls that function. index.html parses the
# CSV in the browser and produces the PDF through the print dialogue; a search of
# the repository on 2026-09-22 found no reference to /api/compile or to
# .netlify/functions anywhere outside the function's own source. So every deploy
# was downloading a LaTeX engine from a third-party GitHub release, and failing
# if that URL was unavailable, to serve an endpoint with no caller.
#
# The download is therefore opt-in. Set BUILD_COMPILE_FUNCTION=1 in the Netlify
# environment to restore it; the function and the .tex templates are untouched,
# so wiring the front end up to it later needs only that variable.
if [ "${BUILD_COMPILE_FUNCTION:-0}" != "1" ]; then
  echo "[fetch-tectonic] skipped: no caller for /api/compile."
  echo "[fetch-tectonic] set BUILD_COMPILE_FUNCTION=1 to fetch the engine."
  exit 0
fi

# Always fetch the MUSL build to avoid glibc deps
VER="0.15.0"
TARGET="x86_64-unknown-linux-musl"
RELEASE_TAG="tectonic%40${VER}"
ARCHIVE="tectonic-${VER}-${TARGET}.tar.gz"

# Anchor everything to the repo root (current working dir at build start)
REPO_DIR="$(pwd -P)"
OUT_DIR="${REPO_DIR}/netlify/functions/bin"
OUT_BIN="${OUT_DIR}/tectonic"

echo "[fetch-tectonic] Preparing output dir: ${OUT_DIR}"
rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

# Work in a temp dir
WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "${WORKDIR}"; }
trap cleanup EXIT
cd "${WORKDIR}"

URL="https://github.com/tectonic-typesetting/tectonic/releases/download/${RELEASE_TAG}/${ARCHIVE}"
echo "[fetch-tectonic] Downloading MUSL build: ${URL}"
curl -fsSL "${URL}" -o tt.tgz

echo "[fetch-tectonic] Extracting archive…"
tar -xzf tt.tgz

# Locate the binary (path varies per release)
BIN_PATH="$(find . -type f -name 'tectonic' -perm -u+x | head -n1 || true)"
if [ -z "${BIN_PATH}" ]; then
  BIN_PATH="$(find . -type f -name 'tectonic' | head -n1 || true)"
fi
if [ -z "${BIN_PATH}" ]; then
  echo "[fetch-tectonic] ERROR: tectonic binary not found in archive." >&2
  exit 1
fi

echo "[fetch-tectonic] Copying binary to ${OUT_BIN}"
cp "${BIN_PATH}" "${OUT_BIN}"
chmod +x "${OUT_BIN}"

echo "[fetch-tectonic] Done. Binary at ${OUT_BIN}"
