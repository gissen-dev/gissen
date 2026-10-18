#!/usr/bin/env bash
#
# Runs the Quickstart page exactly as written, in a scratch directory outside
# the repo, and builds the result.
#
#   --tarball  (default) installs gissen from a tarball packed from this
#              tree. Use it on pull requests: it checks that the docs match the
#              code in the same change, even for features not yet released.
#   --npm      installs gissen from the npm registry. Run it on a schedule: it
#              catches the world changing without a commit here (a new
#              create-vite template, a new TypeScript major, a broken release).
#
# Usage: bash scripts/quickstart-check/run.sh [--tarball|--npm]
#        KEEP=1 bash scripts/quickstart-check/run.sh   keeps the scratch dir
set -euo pipefail

MODE="--tarball"
if [[ $# -gt 0 ]]; then
  MODE="$1"
fi
if [[ "$MODE" != "--tarball" && "$MODE" != "--npm" ]]; then
  echo "Usage: $0 [--tarball|--npm]" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCS_DIR="$REPO_ROOT/apps/docs"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/gissen-quickstart.XXXXXX")"

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

EXTRACT_ARGS=("$DOCS_DIR")
if [[ "$MODE" == "--tarball" ]]; then
  echo "==> packing gissen from this tree"
  (cd "$REPO_ROOT" && pnpm --filter gissen build >/dev/null)
  mkdir -p "$SCRATCH/pack"
  TARBALL_NAME="$(cd "$REPO_ROOT/packages/core" && npm pack --silent --pack-destination "$SCRATCH/pack" | tail -n 1)"
  EXTRACT_ARGS+=(--tarball "$SCRATCH/pack/$TARBALL_NAME")
fi

node "$REPO_ROOT/scripts/quickstart-check/extract-steps.mjs" "${EXTRACT_ARGS[@]}" > "$SCRATCH/steps.sh"

echo "==> running the quickstart ($MODE)"
mkdir -p "$SCRATCH/work"
(cd "$SCRATCH/work" && bash -x "$SCRATCH/steps.sh")

echo "==> npm run build"
(cd "$SCRATCH/work/my-gissen-app" && npm run build)

echo "OK: the quickstart builds as written ($MODE)"
