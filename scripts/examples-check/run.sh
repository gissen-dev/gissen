#!/usr/bin/env bash
#
# Builds one examples/* app exactly the way a consumer does: copied outside
# the repo (so nothing hoists from the monorepo's own node_modules), with
# its own package-lock.json.
#
#   --tarball  (default) swaps `gissen` (and `gissen-mcp`, for mcp-agent) for
#              a tarball packed from this tree before installing. Use it on
#              pull requests: it checks that an example still builds against
#              the code in the same change, even before a release.
#   --npm      installs straight from the example's committed
#              package-lock.json (`npm ci`) — what a real clone gets today.
#              Run it on a schedule: it catches the world changing (a new
#              Nuxt/Vite major, a broken release) without a commit here.
#
# Usage: bash scripts/examples-check/run.sh <example-name> [--tarball|--npm]
#        KEEP=1 bash scripts/examples-check/run.sh vite-basic --npm
set -euo pipefail

EXAMPLE="${1:-}"
MODE="${2:---tarball}"
if [[ -z "$EXAMPLE" ]]; then
  echo "Usage: $0 <example-name> [--tarball|--npm]" >&2
  exit 2
fi
if [[ "$MODE" != "--tarball" && "$MODE" != "--npm" ]]; then
  echo "Usage: $0 <example-name> [--tarball|--npm]" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXAMPLE_DIR="$REPO_ROOT/examples/$EXAMPLE"
if [[ ! -d "$EXAMPLE_DIR" ]]; then
  echo "No such example: $EXAMPLE_DIR" >&2
  exit 1
fi

SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/gissen-example-$EXAMPLE.XXXXXX")"
case "$SCRATCH" in
  "$REPO_ROOT"/*)
    echo "Refusing to run inside the repo: $SCRATCH" >&2
    exit 1
    ;;
esac

cleanup() {
  if [[ "${KEEP:-0}" == "1" ]]; then
    echo "KEEP=1: leaving $SCRATCH"
  else
    rm -rf "$SCRATCH"
  fi
}
trap cleanup EXIT

WORK="$SCRATCH/work"
mkdir -p "$WORK"
# Copy everything except what npm regenerates anyway, so a stale local
# node_modules in the repo checkout can't leak into the "clean clone" this
# check is supposed to be.
rsync -a --exclude node_modules --exclude .nuxt --exclude .output --exclude dist "$EXAMPLE_DIR/" "$WORK/"
cd "$WORK"

if [[ "$MODE" == "--tarball" ]]; then
  echo "==> packing packages from this tree"
  mkdir -p "$SCRATCH/pack"
  (cd "$REPO_ROOT" && pnpm --filter gissen --filter gissen-mcp build >/dev/null)
  # npm pack prints just the filename on its last stdout line; pnpm pack
  # prints the tarball's full absolute path instead (see
  # scripts/consumer-probe/run.sh, which hit this difference first).
  GISSEN_TARBALL="$SCRATCH/pack/$(cd "$REPO_ROOT/packages/core" && npm pack --silent --pack-destination "$SCRATCH/pack" | tail -n 1)"
  # gissen-mcp depends on `gissen: workspace:*` — `pnpm pack` is the one that
  # rewrites that to an installable version pin; `npm pack` would leave the
  # literal string `workspace:*`, uninstallable outside the workspace.
  MCP_TARBALL="$(cd "$REPO_ROOT/packages/mcp" && pnpm pack --pack-destination "$SCRATCH/pack" 2>/dev/null | tail -1)"

  node -e '
    const fs = require("node:fs")
    const [gissenTarball, mcpTarball] = process.argv.slice(1)
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
    if (pkg.dependencies?.gissen) pkg.dependencies.gissen = `file:${gissenTarball}`
    if (pkg.devDependencies?.["gissen-mcp"]) pkg.devDependencies["gissen-mcp"] = `file:${mcpTarball}`
    fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`)
  ' "$GISSEN_TARBALL" "$MCP_TARBALL"
  rm -f package-lock.json
  echo "==> npm install (tarball)"
  npm install
else
  echo "==> npm ci (committed package-lock.json)"
  npm ci
fi

echo "==> typecheck + build"
if [[ "$EXAMPLE" == "nuxt-ssr" ]]; then
  npm run typecheck
  npm run build
else
  npm run build
fi

if [[ "$EXAMPLE" == "mcp-agent" ]]; then
  echo "==> gissen-mcp loads this example's config standalone and answers tools/list"
  cp page.json "$SCRATCH/page.copy.json"
  MCP_BIN="$WORK/node_modules/gissen-mcp/dist/cli.js"
  INIT_REQUEST='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"examples-check","version":"0.0.0"}}}'
  TOOLS_REQUEST='{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
  ADD_REQUEST='{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add_component","arguments":{"type":"Note"}}}'
  RPC_OUTPUT="$( { printf '%s\n%s\n%s\n' "$INIT_REQUEST" "$TOOLS_REQUEST" "$ADD_REQUEST"; sleep 1; } | node "$MCP_BIN" --config gissen.config.ts --data "$SCRATCH/page.copy.json" 2>/dev/null )"

  node -e '
    const lines = process.argv[1].split("\n").filter(Boolean).map(l => JSON.parse(l))
    const toolsResponse = lines.find(l => l.id === 2)
    const names = (toolsResponse?.result?.tools ?? []).map(t => t.name).sort()
    const expected = ["add_component", "delete_component", "move_component", "read_page", "update_component"].sort()
    if (JSON.stringify(names) !== JSON.stringify(expected)) {
      console.error("FAIL: tools/list returned " + JSON.stringify(names))
      process.exit(1)
    }
    const addResponse = lines.find(l => l.id === 3)
    const text = addResponse?.result?.content?.[0]?.text ?? ""
    if (!text.includes("Added a \"Note\"")) {
      console.error("FAIL: add_component did not report success: " + text)
      process.exit(1)
    }
  ' "$RPC_OUTPUT"
  echo "    OK: tools/list has all five tools, add_component wrote the copy"
fi

echo "OK: $EXAMPLE builds as a standalone consumer install ($MODE)"
