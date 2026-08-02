#!/usr/bin/env bash
#
# Consumer-perspective package probe — REQUIRED before every publish.
#
# Two serious defects (the CI ordering bug and the `.vue`-import hole in
# dist/index.d.ts) were invisible from inside the monorepo: workspace path
# aliases resolve types from src/, so only a real consumer install sees what
# actually ships. This script verifies the package the way a consumer gets it:
#
#   1. builds the package and packs the real tarball (`npm pack`)
#   2. statically checks the packed declarations are self-contained
#      (no relative / `.vue` imports, no reference paths outside the file)
#   3. checks the tarball carries README + package.json metadata
#   4. installs the tarball into a scratch Vue + TS app OUTSIDE the workspace
#      and runs vue-tsc over fixture code that asserts (see fixture/src/):
#        (a) GissenEditor / GissenRender are fully typed, not `any`
#        (b) a malformed `config` is a type error
#        (c) defineGissenConfig inference survives the package boundary
#        (d) the `gissen/render` subpath types resolve
#
# Usage: pnpm probe:consumer          (from the repo root)
#        PROBE_KEEP=1 pnpm probe:consumer   keeps the scratch dirs for autopsy
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CORE_DIR="$REPO_ROOT/packages/core"
FIXTURE_DIR="$REPO_ROOT/scripts/consumer-probe/fixture"

PACK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gissen-probe-pack.XXXXXX")"
SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gissen-probe-app.XXXXXX")"

cleanup() {
  if [[ "${PROBE_KEEP:-0}" == "1" ]]; then
    echo "PROBE_KEEP=1 — keeping $PACK_DIR and $SCRATCH_DIR"
  else
    rm -rf "$PACK_DIR" "$SCRATCH_DIR"
  fi
}
trap cleanup EXIT

# The whole point is testing from OUTSIDE the workspace — refuse to run inside.
case "$SCRATCH_DIR" in
  "$REPO_ROOT"*) echo "FAIL: scratch dir resolved inside the repo" >&2; exit 1 ;;
esac

echo "==> [1/4] Building gissen"
pnpm --dir "$REPO_ROOT" --filter gissen build >/dev/null

echo "==> [2/4] Packing tarball + structural declaration check"
TARBALL_NAME="$(cd "$CORE_DIR" && npm pack --pack-destination "$PACK_DIR" 2>/dev/null | tail -1)"
TARBALL="$PACK_DIR/$TARBALL_NAME"
tar -xzf "$TARBALL" -C "$PACK_DIR"

DTS_COUNT=0
for dts in "$PACK_DIR"/package/dist/*.d.ts; do
  [[ -e "$dts" ]] || { echo "FAIL: no .d.ts files in the packed dist/" >&2; exit 1; }
  DTS_COUNT=$((DTS_COUNT + 1))
  # Bundled declarations must be self-contained: only bare package specifiers
  # (vue, zod) are legitimate. Any relative import, any `.vue` specifier, or
  # any reference path means a consumer resolves into files we don't ship.
  if grep -nE "(from|import\()[[:space:]]*['\"]\.|['\"][^'\"]*\.vue['\"]|///[[:space:]]*<reference[[:space:]]+path" "$dts"; then
    echo "FAIL: $(basename "$dts") references files outside itself (see matches above)" >&2
    exit 1
  fi
done
echo "    OK: $DTS_COUNT declaration file(s), all self-contained"

echo "==> [3/4] Tarball metadata check"
[[ -f "$PACK_DIR/package/README.md" ]] || { echo "FAIL: README.md missing from tarball" >&2; exit 1; }
node -e "
  const pkg = require('$PACK_DIR/package/package.json')
  const missing = ['keywords', 'repository', 'homepage', 'bugs', 'license', 'description']
    .filter(f => pkg[f] === undefined || (Array.isArray(pkg[f]) && pkg[f].length === 0))
  if (missing.length) { console.error('FAIL: package.json missing fields: ' + missing.join(', ')); process.exit(1) }
  for (const subpath of ['.', './render']) {
    const types = pkg.exports?.[subpath]?.types
    if (!types) { console.error('FAIL: exports[\"' + subpath + '\"].types missing'); process.exit(1) }
  }
"
echo "    OK: README + metadata + exports types present"

echo "==> [4/4] Scratch consumer app (vue-tsc against the tarball)"
cp -R "$FIXTURE_DIR/." "$SCRATCH_DIR/"
cd "$SCRATCH_DIR"
npm install --no-audit --no-fund --loglevel=error >/dev/null
npm install --no-audit --no-fund --loglevel=error "$TARBALL" >/dev/null
if ! npm run --silent probe; then
  echo "FAIL: consumer type probe failed (scratch app: $SCRATCH_DIR, run with PROBE_KEEP=1 to inspect)" >&2
  exit 1
fi

echo ""
echo "PASS: consumer probe green —"
echo "  (a) GissenEditor / GissenRender fully typed (IsAny tripwires)"
echo "  (b) malformed config rejected (@ts-expect-error + @vue-expect-error)"
echo "  (c) defineGissenConfig inference intact across the package boundary"
echo "  (d) gissen/render subpath types resolve"
