#!/usr/bin/env bash
#
# Turns a screen recording into the three files the docs site picks up
# automatically: <kind>.mp4, <kind>.webm and <kind>-poster.jpg, written to
# apps/docs/public/demo/. Nothing in the site's code changes: the build looks
# for those files (apps/docs/.vitepress/config.ts) and shows the video in
# place of the fallback when they exist.
#
#   kind   editor   the landing page hero: editing by hand
#          agent    the AI section of the landing page and the MCP guide
#
# Read scripts/demo-video/README.md first, in particular the privacy
# checklist: files written here are committed to git and published.
#
# Usage: bash scripts/demo-video/encode.sh <input-video> <editor|agent> [start-seconds]
#        start-seconds picks the frame used for the poster (default 1).
#
# Needs ffmpeg and ffprobe on PATH (macOS: `brew install ffmpeg`).
set -euo pipefail

INPUT="${1:-}"
KIND="${2:-}"
POSTER_AT="${3:-1}"

if [[ -z "$INPUT" || ( "$KIND" != "editor" && "$KIND" != "agent" ) ]]; then
  echo "Usage: $0 <input-video> <editor|agent> [poster-second]" >&2
  exit 2
fi
if [[ ! -f "$INPUT" ]]; then
  echo "No such file: $INPUT" >&2
  exit 1
fi
for tool in ffmpeg ffprobe; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "$tool not found. Install ffmpeg (macOS: brew install ffmpeg)." >&2
    exit 1
  fi
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$REPO_ROOT/apps/docs/public/demo"
mkdir -p "$OUT"

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")"
echo "input: $INPUT (${DURATION%.*}s)"
if awk "BEGIN { exit !($DURATION > 35) }"; then
  echo "warning: longer than 35s. The spec is 20 to 30 seconds; shorter loops read better." >&2
fi

# Width capped at 1280 and even (H.264 needs even dimensions), never upscaled.
SCALE="scale='min(1280,iw)':-2"

echo "==> mp4 (H.264, no audio)"
ffmpeg -v error -y -i "$INPUT" -an -vf "$SCALE" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart \
  "$OUT/$KIND.mp4"

echo "==> webm (VP9, no audio)"
ffmpeg -v error -y -i "$INPUT" -an -vf "$SCALE" \
  -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 \
  "$OUT/$KIND.webm"

echo "==> poster"
ffmpeg -v error -y -ss "$POSTER_AT" -i "$INPUT" -frames:v 1 -vf "$SCALE" -q:v 4 \
  "$OUT/$KIND-poster.jpg"

status=0
for file in "$KIND.mp4" "$KIND.webm" "$KIND-poster.jpg"; do
  bytes="$(wc -c < "$OUT/$file" | tr -d ' ')"
  printf '    %-22s %8s bytes\n' "$file" "$bytes"
  # Files are committed to git, so a few megabytes each is the budget.
  if [[ "$bytes" -gt 3145728 ]]; then
    echo "    warning: $file is over 3 MB. Shorten the clip, or crop to the editor." >&2
    status=1
  fi
done

echo
echo "Done. Before committing, watch the files once, frame by frame: see the privacy checklist in scripts/demo-video/README.md."
exit "$status"
