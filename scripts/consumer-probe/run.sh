#!/usr/bin/env bash
#
# Consumer-perspective package probe — REQUIRED before every publish.
#
# Two serious defects (the CI ordering bug and the `.vue`-import hole in
# dist/index.d.ts) were invisible from inside the monorepo: workspace path
# aliases resolve types from src/, so only a real consumer install sees what
# actually ships. This script verifies both published packages the way a
# consumer gets them.
#
# gissen (core):
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
# gissen-mcp:
#   1. builds the package and packs the real tarball with `pnpm pack`, NOT
#      `npm pack` — gissen-mcp depends on `gissen: workspace:*`, and `pnpm
#      pack` is the one that rewrites that to an installable version pin;
#      `npm pack` leaves the literal string `workspace:*`, which npm outside
#      the workspace cannot resolve at all. (core has no workspace: deps, so
#      npm pack is fine for it and stays untouched, matching CONTRIBUTING.md.)
#   2. checks the packed package.json has no leftover `workspace:` string,
#      that its declared `bin` file is actually in the tarball with a
#      `#!/usr/bin/env node` shebang (the CLI-package analogue of core's
#      self-contained-declarations check), and the same metadata fields core
#      asserts
#   3. installs BOTH tarballs together (this tree's core + this tree's mcp,
#      one `npm install`) into a scratch dir OUTSIDE the workspace, runs the
#      bin with no args (expects the usage error), then runs it against a
#      fixture config + data file and speaks raw JSON-RPC over its real
#      stdio to confirm it answers `tools/list` with all five tools. Both
#      tarballs together — not mcp's alone — so the probe exercises this
#      tree's core, not whatever happens to be the newest release on npm.
#
# Usage: pnpm probe:consumer          (from the repo root)
#        PROBE_KEEP=1 pnpm probe:consumer   keeps the scratch dirs for autopsy
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CORE_DIR="$REPO_ROOT/packages/core"
MCP_DIR="$REPO_ROOT/packages/mcp"
FIXTURE_DIR="$REPO_ROOT/scripts/consumer-probe/fixture"
MCP_FIXTURE_DIR="$REPO_ROOT/scripts/consumer-probe/mcp-fixture"

PACK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gissen-probe-pack.XXXXXX")"
SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gissen-probe-app.XXXXXX")"
MCP_SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/gissen-probe-mcp-app.XXXXXX")"

cleanup() {
  if [[ "${PROBE_KEEP:-0}" == "1" ]]; then
    echo "PROBE_KEEP=1 — keeping $PACK_DIR, $SCRATCH_DIR, and $MCP_SCRATCH_DIR"
  else
    rm -rf "$PACK_DIR" "$SCRATCH_DIR" "$MCP_SCRATCH_DIR"
  fi
}
trap cleanup EXIT

# The whole point is testing from OUTSIDE the workspace — refuse to run inside.
for dir in "$SCRATCH_DIR" "$MCP_SCRATCH_DIR"; do
  case "$dir" in
    "$REPO_ROOT"*) echo "FAIL: scratch dir resolved inside the repo: $dir" >&2; exit 1 ;;
  esac
done

echo "==> gissen (core)"

echo "  [1/4] Building gissen"
pnpm --dir "$REPO_ROOT" --filter gissen build >/dev/null

echo "  [2/4] Packing tarball + structural declaration check"
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

echo "  [3/4] Tarball metadata check"
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

echo "  [4/4] Scratch consumer app (vue-tsc against the tarball)"
cp -R "$FIXTURE_DIR/." "$SCRATCH_DIR/"
cd "$SCRATCH_DIR"
npm install --no-audit --no-fund --loglevel=error >/dev/null
npm install --no-audit --no-fund --loglevel=error "$TARBALL" >/dev/null
if ! npm run --silent probe; then
  echo "FAIL: consumer type probe failed (scratch app: $SCRATCH_DIR, run with PROBE_KEEP=1 to inspect)" >&2
  exit 1
fi

echo ""
echo "PASS: gissen probe green —"
echo "  (a) GissenEditor / GissenRender fully typed (IsAny tripwires)"
echo "  (b) malformed config rejected (@ts-expect-error + @vue-expect-error)"
echo "  (c) defineGissenConfig inference intact across the package boundary"
echo "  (d) gissen/render subpath types resolve"

echo ""
echo "==> gissen-mcp"

echo "  [1/3] Building gissen-mcp"
pnpm --dir "$REPO_ROOT" --filter gissen-mcp build >/dev/null

echo "  [2/3] Packing tarball (pnpm pack) + structural checks"
# Unlike `npm pack` (which prints just the filename), `pnpm pack` prints the
# tarball's full absolute path on the last stdout line — use it directly.
MCP_TARBALL="$(cd "$MCP_DIR" && pnpm pack --pack-destination "$PACK_DIR" 2>/dev/null | tail -1)"
mkdir -p "$PACK_DIR/mcp-unpacked"
tar -xzf "$MCP_TARBALL" -C "$PACK_DIR/mcp-unpacked"
MCP_PACKED_DIR="$PACK_DIR/mcp-unpacked/package"

# The one bug this whole leg exists to catch: `npm pack` leaves a
# `workspace:*` dependency untouched, which is uninstallable outside the
# workspace. `pnpm pack` rewrites it — assert none survived.
if grep -q "workspace:" "$MCP_PACKED_DIR/package.json"; then
  echo "FAIL: packed gissen-mcp package.json still contains a workspace: reference — was it packed with npm instead of pnpm?" >&2
  exit 1
fi

MCP_BIN_REL="$(node -e "console.log(require('$MCP_PACKED_DIR/package.json').bin['gissen-mcp'])")"
MCP_BIN_IN_TARBALL="$MCP_PACKED_DIR/$MCP_BIN_REL"
[[ -f "$MCP_BIN_IN_TARBALL" ]] || { echo "FAIL: bin.gissen-mcp ($MCP_BIN_REL) is not present in the tarball" >&2; exit 1; }
if ! head -c 32 "$MCP_BIN_IN_TARBALL" | grep -q '^#!/usr/bin/env node'; then
  echo "FAIL: $MCP_BIN_REL has no '#!/usr/bin/env node' shebang — its bin symlink would be unexecutable" >&2
  exit 1
fi

[[ -f "$MCP_PACKED_DIR/README.md" ]] || { echo "FAIL: README.md missing from gissen-mcp tarball" >&2; exit 1; }
node -e "
  const pkg = require('$MCP_PACKED_DIR/package.json')
  const missing = ['keywords', 'repository', 'homepage', 'bugs', 'license', 'description']
    .filter(f => pkg[f] === undefined || (Array.isArray(pkg[f]) && pkg[f].length === 0))
  if (missing.length) { console.error('FAIL: package.json missing fields: ' + missing.join(', ')); process.exit(1) }
"
echo "    OK: no workspace: leftovers, bin present with an executable shebang, README + metadata present"

echo "  [3/3] Installing outside the workspace and running the bin over real stdio"
echo '{"name":"gissen-mcp-probe","private":true}' > "$MCP_SCRATCH_DIR/package.json"
cp "$MCP_FIXTURE_DIR/gissen.config.ts" "$MCP_SCRATCH_DIR/"
cp "$MCP_FIXTURE_DIR/page.json" "$MCP_SCRATCH_DIR/"
cd "$MCP_SCRATCH_DIR"
# Both tarballs together, not mcp's alone: mcp's tarball pins an exact
# gissen version that resolves from the public registry on its own, but
# that would silently test this tree's mcp against whatever core is
# currently published — not the core sitting in this working tree.
npm install --no-audit --no-fund --loglevel=error "$TARBALL" "$MCP_TARBALL" >/dev/null

MCP_BIN="$MCP_SCRATCH_DIR/node_modules/.bin/gissen-mcp"
[[ -x "$MCP_BIN" ]] || { echo "FAIL: node_modules/.bin/gissen-mcp missing or not executable after install" >&2; exit 1; }

set +e
USAGE_OUTPUT="$("$MCP_BIN" 2>&1 < /dev/null)"
USAGE_EXIT=$?
set -e
if [[ "$USAGE_EXIT" -eq 0 ]]; then
  echo "FAIL: gissen-mcp with no flags exited 0, expected a non-zero usage error" >&2
  exit 1
fi
if [[ "$USAGE_OUTPUT" != *"Usage:"* ]]; then
  echo "FAIL: gissen-mcp with no flags did not print a usage message:" >&2
  echo "$USAGE_OUTPUT" >&2
  exit 1
fi

INIT_REQUEST='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"consumer-probe","version":"0.0.0"}}}'
TOOLS_REQUEST='{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
RPC_OUTPUT="$( { printf '%s\n%s\n' "$INIT_REQUEST" "$TOOLS_REQUEST"; sleep 1; } | "$MCP_BIN" --config "$MCP_SCRATCH_DIR/gissen.config.ts" --data "$MCP_SCRATCH_DIR/page.json" 2>/dev/null )"

TOOLS_RESPONSE="$(echo "$RPC_OUTPUT" | grep '"id":2' || true)"
if [[ -z "$TOOLS_RESPONSE" ]]; then
  echo "FAIL: no tools/list response received over stdio" >&2
  echo "$RPC_OUTPUT" >&2
  exit 1
fi

node -e "
  const message = JSON.parse(process.argv[1])
  const names = (message.result?.tools ?? []).map(t => t.name).sort()
  const expected = ['add_component', 'delete_component', 'move_component', 'read_page', 'update_component'].sort()
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    console.error('FAIL: tools/list returned unexpected tool names: ' + JSON.stringify(names))
    process.exit(1)
  }
" "$TOOLS_RESPONSE"
echo "    OK: installs standalone, bin is executable, answers tools/list with all five tools over real stdio"

echo ""
echo "PASS: gissen-mcp probe green —"
echo "  tarball has no workspace: leftovers and installs outside the workspace"
echo "  bin.gissen-mcp resolves, is executable, and runs a real MCP session over stdio"
